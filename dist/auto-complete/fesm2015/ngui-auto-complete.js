import { ɵɵdefineInjectable, ɵɵinject, Injectable, Optional, EventEmitter, Component, ViewEncapsulation, ElementRef, Input, Output, ViewChild, Directive, ComponentFactoryResolver, ViewContainerRef, Host, SkipSelf, NgModule } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map } from 'rxjs/operators';
import { FormGroupName, ControlContainer, FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

class NguiAutoComplete {
    constructor(http) {
        this.http = http;
        // ...
    }
    filter(list, keyword, matchFormatted, accentInsensitive) {
        return accentInsensitive
            ? list.filter((el) => {
                const objStr = matchFormatted ? this.getFormattedListItem(el).toLowerCase() : JSON.stringify(el).toLowerCase();
                keyword = keyword.toLowerCase();
                return objStr.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
                    .indexOf(keyword.normalize('NFD').replace(/[\u0300-\u036f]/g, '')) !== -1;
            })
            : list.filter((el) => {
                const objStr = matchFormatted ? this.getFormattedListItem(el).toLowerCase() : JSON.stringify(el).toLowerCase();
                keyword = keyword.toLowerCase();
                return objStr.indexOf(keyword) !== -1;
            });
    }
    getFormattedListItem(data) {
        let formatted;
        const formatter = this.listFormatter || '(id) value';
        if (typeof formatter === 'function') {
            formatted = formatter.apply(this, [data]);
        }
        else if (typeof data !== 'object') {
            formatted = data;
        }
        else if (typeof formatter === 'string') {
            formatted = formatter;
            const matches = formatter.match(/[a-zA-Z0-9_\$]+/g);
            if (matches && typeof data !== 'string') {
                matches.forEach((key) => {
                    formatted = formatted.replace(key, data[key]);
                });
            }
        }
        return formatted;
    }
    /**
     * return remote data from the given source and options, and data path
     */
    getRemoteData(keyword) {
        if (typeof this.source !== 'string') {
            throw new TypeError('Invalid type of source, must be a string. e.g. http://www.google.com?q=:my_keyword');
        }
        else if (!this.http) {
            throw new Error('Http is required.');
        }
        const matches = this.source.match(/:[a-zA-Z_]+/);
        if (matches === null) {
            throw new Error('Replacement word is missing.');
        }
        const replacementWord = matches[0];
        const url = this.source.replace(replacementWord, keyword);
        return this.http.get(url)
            .pipe(map((list) => {
            if (this.pathToData) {
                const paths = this.pathToData.split('.');
                paths.forEach((prop) => list = list[prop]);
            }
            return list;
        }));
    }
}
NguiAutoComplete.ɵprov = ɵɵdefineInjectable({ factory: function NguiAutoComplete_Factory() { return new NguiAutoComplete(ɵɵinject(HttpClient, 8)); }, token: NguiAutoComplete, providedIn: "root" });
NguiAutoComplete.decorators = [
    { type: Injectable, args: [{
                providedIn: 'root'
            },] }
];
NguiAutoComplete.ctorParameters = () => [
    { type: HttpClient, decorators: [{ type: Optional }] }
];

class NguiAutoCompleteComponent {
    /**
     * constructor
     */
    constructor(elementRef, autoComplete) {
        this.autoComplete = autoComplete;
        /**
         * public input properties
         */
        this.autocomplete = false;
        this.minChars = 0;
        this.acceptUserInput = true;
        this.loadingText = 'Loading';
        this.loadingTemplate = null;
        this.showInputTag = true;
        this.showDropdownOnInit = false;
        this.tabToSelect = true;
        this.matchFormatted = false;
        this.autoSelectFirstItem = false;
        this.selectOnBlur = false;
        this.reFocusAfterSelect = true;
        this.headerItemTemplate = null;
        this.ignoreAccents = true;
        this.valueSelected = new EventEmitter();
        this.customSelected = new EventEmitter();
        this.textEntered = new EventEmitter();
        this.dropdownVisible = false;
        this.isLoading = false;
        this.filteredList = [];
        this.minCharsEntered = false;
        this.itemIndex = null;
        this.timer = 0;
        this.delay = (() => {
            let timer = null;
            return (callback, ms) => {
                clearTimeout(timer);
                timer = setTimeout(callback, ms);
            };
        })();
        this.selectOnEnter = false;
        this.reloadListInDelay = (evt) => {
            const delayMs = this.isSrcArr() ? 10 : 500;
            const keyword = evt.target.value;
            // executing after user stopped typing
            this.delay(() => this.reloadList(keyword), delayMs);
        };
        this.inputElKeyHandler = (evt) => {
            const totalNumItem = this.filteredList.length;
            if (!this.selectOnEnter && this.autoSelectFirstItem && (0 !== totalNumItem)) {
                this.selectOnEnter = true;
            }
            switch (evt.keyCode) {
                case 27: // ESC, hide auto complete
                    this.selectOnEnter = false;
                    this.selectOne(undefined);
                    break;
                case 38: // UP, select the previous li el
                    if (0 === totalNumItem) {
                        return;
                    }
                    this.selectOnEnter = true;
                    this.itemIndex = (totalNumItem + this.itemIndex - 1) % totalNumItem;
                    this.scrollToView(this.itemIndex);
                    break;
                case 40: // DOWN, select the next li el or the first one
                    if (0 === totalNumItem) {
                        return;
                    }
                    this.selectOnEnter = true;
                    this.dropdownVisible = true;
                    let sum = this.itemIndex;
                    sum = (this.itemIndex === null) ? 0 : sum + 1;
                    this.itemIndex = (totalNumItem + sum) % totalNumItem;
                    this.scrollToView(this.itemIndex);
                    break;
                case 13: // ENTER, choose it!!
                    if (this.selectOnEnter) {
                        this.selectOne(this.filteredList[this.itemIndex]);
                    }
                    evt.preventDefault();
                    break;
                case 9: // TAB, choose if tab-to-select is enabled
                    if (this.tabToSelect) {
                        this.selectOne(this.filteredList[this.itemIndex]);
                    }
                    break;
            }
        };
        this.el = elementRef.nativeElement;
    }
    /**
     * user enters into input el, shows list to select, then select one
     */
    ngOnInit() {
        this.autoComplete.source = this.source;
        this.autoComplete.pathToData = this.pathToData;
        this.autoComplete.listFormatter = this.listFormatter;
        if (this.autoSelectFirstItem) {
            this.itemIndex = 0;
        }
        setTimeout(() => {
            if (this.autoCompleteInput && this.reFocusAfterSelect) {
                this.autoCompleteInput.nativeElement.focus();
            }
            if (this.showDropdownOnInit) {
                this.showDropdownList({ target: { value: '' } });
            }
        });
    }
    isSrcArr() {
        return Array.isArray(this.source);
    }
    showDropdownList(event) {
        this.dropdownVisible = true;
        this.reloadList(event.target.value);
    }
    hideDropdownList() {
        this.selectOnEnter = false;
        this.dropdownVisible = false;
    }
    findItemFromSelectValue(selectText) {
        const matchingItems = this.filteredList.filter((item) => ('' + item) === selectText);
        return matchingItems.length ? matchingItems[0] : null;
    }
    reloadList(keyword) {
        this.filteredList = [];
        if (keyword.length < (this.minChars || 0)) {
            this.minCharsEntered = false;
            return;
        }
        else {
            this.minCharsEntered = true;
        }
        if (this.isSrcArr()) { // local source
            this.isLoading = false;
            this.filteredList = this.autoComplete.filter(this.source, keyword, this.matchFormatted, this.ignoreAccents);
            if (this.maxNumList) {
                this.filteredList = this.filteredList.slice(0, this.maxNumList);
            }
        }
        else { // remote source
            this.isLoading = true;
            if (typeof this.source === 'function') {
                // custom function that returns observable
                this.source(keyword).subscribe((resp) => {
                    if (this.pathToData) {
                        const paths = this.pathToData.split('.');
                        paths.forEach((prop) => resp = resp[prop]);
                    }
                    this.filteredList = resp;
                    if (this.maxNumList) {
                        this.filteredList = this.filteredList.slice(0, this.maxNumList);
                    }
                }, (error) => null, () => this.isLoading = false // complete
                );
            }
            else {
                // remote source
                this.autoComplete.getRemoteData(keyword).subscribe((resp) => {
                    this.filteredList = resp ? resp : [];
                    if (this.maxNumList) {
                        this.filteredList = this.filteredList.slice(0, this.maxNumList);
                    }
                }, (error) => null, () => this.isLoading = false // complete
                );
            }
        }
    }
    selectOne(data) {
        if (!!data || data === '') {
            this.valueSelected.emit(data);
        }
        else {
            this.customSelected.emit(this.keyword);
        }
    }
    enterText(data) {
        this.textEntered.emit(data);
    }
    blurHandler(evt) {
        if (this.selectOnBlur) {
            this.selectOne(this.filteredList[this.itemIndex]);
        }
        this.hideDropdownList();
    }
    scrollToView(index) {
        const container = this.autoCompleteContainer.nativeElement;
        const ul = container.querySelector('ul');
        const li = ul.querySelector('li'); // just sample the first li to get height
        const liHeight = li.offsetHeight;
        const scrollTop = ul.scrollTop;
        const viewport = scrollTop + ul.offsetHeight;
        const scrollOffset = liHeight * index;
        if (scrollOffset < scrollTop || (scrollOffset + liHeight) > viewport) {
            ul.scrollTop = scrollOffset;
        }
    }
    trackByIndex(index, item) {
        return index;
    }
    get emptyList() {
        return !(this.isLoading ||
            (this.minCharsEntered && !this.isLoading && !this.filteredList.length) ||
            (this.filteredList.length));
    }
}
NguiAutoCompleteComponent.decorators = [
    { type: Component, args: [{
                selector: 'ngui-auto-complete',
                template: `
    <div #autoCompleteContainer class="ngui-auto-complete">
      <!-- keyword input -->
      <input *ngIf="showInputTag"
             #autoCompleteInput class="keyword"
             [attr.autocomplete]="autocomplete ? 'null' : 'off'"
             placeholder="{{placeholder}}"
             (focus)="showDropdownList($event)"
             (blur)="blurHandler($event)"
             (keydown)="inputElKeyHandler($event)"
             (input)="reloadListInDelay($event)"
             [(ngModel)]="keyword"/>

      <!-- dropdown that user can select -->
      <ul *ngIf="dropdownVisible" [class.empty]="emptyList">
        <li *ngIf="isLoading && loadingTemplate" class="loading"
            [innerHTML]="loadingTemplate"></li>
        <li *ngIf="isLoading && !loadingTemplate" class="loading">{{loadingText}}</li>
        <li *ngIf="minCharsEntered && !isLoading && !filteredList.length"
            (mousedown)="selectOne('')"
            class="no-match-found">{{noMatchFoundText || 'No Result Found'}}
        </li>
        <li *ngIf="headerItemTemplate && filteredList.length" class="header-item"
            [innerHTML]="headerItemTemplate"></li>
        <li *ngIf="blankOptionText && filteredList.length"
            (mousedown)="selectOne('')"
            class="blank-item">{{blankOptionText}}
        </li>
        <li class="item"
            *ngFor="let item of filteredList; let i=index; trackBy: trackByIndex"
            (mousedown)="selectOne(item)"
            [ngClass]="{selected: i === itemIndex}"
            [innerHtml]="autoComplete.getFormattedListItem(item)">
        </li>
      </ul>

    </div>
  `,
                encapsulation: ViewEncapsulation.None,
                styles: [`
    @keyframes slideDown {
      0% {
        transform: translateY(-10px);
      }
      100% {
        transform: translateY(0px);
      }
    }

    .ngui-auto-complete {
      background-color: transparent;
    }

    .ngui-auto-complete > input {
      outline: none;
      border: 0;
      padding: 2px;
      box-sizing: border-box;
      background-clip: content-box;
    }

    .ngui-auto-complete > ul {
      background-color: #fff;
      margin: 0;
      width: 100%;
      overflow-y: auto;
      list-style-type: none;
      padding: 0;
      border: 1px solid #ccc;
      box-sizing: border-box;
      animation: slideDown 0.1s;
    }

    .ngui-auto-complete > ul.empty {
      display: none;
    }

    .ngui-auto-complete > ul li {
      padding: 2px 5px;
      border-bottom: 1px solid #eee;
    }

    .ngui-auto-complete > ul li.selected {
      background-color: #ccc;
    }

    .ngui-auto-complete > ul li:last-child {
      border-bottom: none;
    }

    .ngui-auto-complete > ul li:not(.header-item):hover {
      background-color: #ccc;
    }`]
            },] }
];
NguiAutoCompleteComponent.ctorParameters = () => [
    { type: ElementRef },
    { type: NguiAutoComplete }
];
NguiAutoCompleteComponent.propDecorators = {
    autocomplete: [{ type: Input, args: ['autocomplete',] }],
    listFormatter: [{ type: Input, args: ['list-formatter',] }],
    source: [{ type: Input, args: ['source',] }],
    pathToData: [{ type: Input, args: ['path-to-data',] }],
    minChars: [{ type: Input, args: ['min-chars',] }],
    placeholder: [{ type: Input, args: ['placeholder',] }],
    blankOptionText: [{ type: Input, args: ['blank-option-text',] }],
    noMatchFoundText: [{ type: Input, args: ['no-match-found-text',] }],
    acceptUserInput: [{ type: Input, args: ['accept-user-input',] }],
    loadingText: [{ type: Input, args: ['loading-text',] }],
    loadingTemplate: [{ type: Input, args: ['loading-template',] }],
    maxNumList: [{ type: Input, args: ['max-num-list',] }],
    showInputTag: [{ type: Input, args: ['show-input-tag',] }],
    showDropdownOnInit: [{ type: Input, args: ['show-dropdown-on-init',] }],
    tabToSelect: [{ type: Input, args: ['tab-to-select',] }],
    matchFormatted: [{ type: Input, args: ['match-formatted',] }],
    autoSelectFirstItem: [{ type: Input, args: ['auto-select-first-item',] }],
    selectOnBlur: [{ type: Input, args: ['select-on-blur',] }],
    reFocusAfterSelect: [{ type: Input, args: ['re-focus-after-select',] }],
    headerItemTemplate: [{ type: Input, args: ['header-item-template',] }],
    ignoreAccents: [{ type: Input, args: ['ignore-accents',] }],
    valueSelected: [{ type: Output }],
    customSelected: [{ type: Output }],
    textEntered: [{ type: Output }],
    autoCompleteInput: [{ type: ViewChild, args: ['autoCompleteInput',] }],
    autoCompleteContainer: [{ type: ViewChild, args: ['autoCompleteContainer',] }]
};

class NguiAutoCompleteDirective {
    constructor(resolver, viewContainerRef, parentForm) {
        this.resolver = resolver;
        this.viewContainerRef = viewContainerRef;
        this.parentForm = parentForm;
        this.autocomplete = false;
        this.acceptUserInput = true;
        this.loadingTemplate = null;
        this.loadingText = 'Loading';
        this.tabToSelect = true;
        this.selectOnBlur = false;
        this.matchFormatted = false;
        this.autoSelectFirstItem = false;
        this.openOnFocus = true;
        this.closeOnFocusOut = true;
        this.reFocusAfterSelect = true;
        this.headerItemTemplate = null;
        this.ignoreAccents = true;
        this.zIndex = '1';
        this.isRtl = false;
        this.ngModelChange = new EventEmitter();
        this.valueChanged = new EventEmitter();
        this.customSelected = new EventEmitter();
        // show auto-complete list below the current element
        this.showAutoCompleteDropdown = (event) => {
            if (this.dropdownJustHidden) {
                return;
            }
            this.hideAutoCompleteDropdown();
            this.scheduledBlurHandler = null;
            const factory = this.resolver.resolveComponentFactory(NguiAutoCompleteComponent);
            this.componentRef = this.viewContainerRef.createComponent(factory);
            const component = this.componentRef.instance;
            component.keyword = this.inputEl.value;
            component.showInputTag = false; // Do NOT display autocomplete input tag separately
            component.pathToData = this.pathToData;
            component.minChars = this.minChars;
            component.source = this.source;
            component.placeholder = this.autoCompletePlaceholder;
            component.acceptUserInput = this.acceptUserInput;
            component.maxNumList = parseInt(this.maxNumList, 10);
            component.loadingText = this.loadingText;
            component.loadingTemplate = this.loadingTemplate;
            component.listFormatter = this.listFormatter;
            component.blankOptionText = this.blankOptionText;
            component.noMatchFoundText = this.noMatchFoundText;
            component.tabToSelect = this.tabToSelect;
            component.selectOnBlur = this.selectOnBlur;
            component.matchFormatted = this.matchFormatted;
            component.autoSelectFirstItem = this.autoSelectFirstItem;
            component.headerItemTemplate = this.headerItemTemplate;
            component.ignoreAccents = this.ignoreAccents;
            component.valueSelected.subscribe(this.selectNewValue);
            component.textEntered.subscribe(this.enterNewText);
            component.customSelected.subscribe(this.selectCustomValue);
            this.acDropdownEl = this.componentRef.location.nativeElement;
            this.acDropdownEl.style.display = 'none';
            // if this element is not an input tag, move dropdown after input tag
            // so that it displays correctly
            // TODO: confirm with owners
            // with some reason, viewContainerRef.createComponent is creating element
            // to parent div which is created by us on ngOnInit, please try this with demo
            // if (this.el.tagName !== 'INPUT' && this.acDropdownEl) {
            this.inputEl.parentElement.insertBefore(this.acDropdownEl, this.inputEl.nextSibling);
            // }
            this.revertValue = typeof this.ngModel !== 'undefined' ? this.ngModel : this.inputEl.value;
            setTimeout(() => {
                component.reloadList(this.inputEl.value);
                this.styleAutoCompleteDropdown();
                component.dropdownVisible = true;
            });
        };
        this.hideAutoCompleteDropdown = (event) => {
            if (this.componentRef) {
                let currentItem;
                const hasRevertValue = (typeof this.revertValue !== 'undefined');
                if (this.inputEl && hasRevertValue && this.acceptUserInput === false) {
                    currentItem = this.componentRef.instance.findItemFromSelectValue(this.inputEl.value);
                }
                this.componentRef.destroy();
                this.componentRef = undefined;
                if (this.inputEl && hasRevertValue && this.acceptUserInput === false && currentItem === null) {
                    this.selectNewValue(this.revertValue);
                }
                else if (this.inputEl && this.acceptUserInput === true && typeof currentItem === 'undefined' && event && event.target.value) {
                    this.enterNewText(event.target.value);
                }
            }
            this.dropdownJustHidden = true;
            setTimeout(() => this.dropdownJustHidden = false, 100);
        };
        this.styleAutoCompleteDropdown = () => {
            if (this.componentRef) {
                const component = this.componentRef.instance;
                /* setting width/height auto complete */
                const thisElBCR = this.el.getBoundingClientRect();
                const thisInputElBCR = this.inputEl.getBoundingClientRect();
                const closeToBottom = thisInputElBCR.bottom + 100 > window.innerHeight;
                const directionOfStyle = this.isRtl ? 'right' : 'left';
                this.acDropdownEl.style.width = thisInputElBCR.width + 'px';
                this.acDropdownEl.style.position = 'absolute';
                this.acDropdownEl.style.zIndex = this.zIndex;
                this.acDropdownEl.style[directionOfStyle] = '0';
                this.acDropdownEl.style.display = 'inline-block';
                if (closeToBottom) {
                    this.acDropdownEl.style.bottom = `${thisInputElBCR.height}px`;
                }
                else {
                    this.acDropdownEl.style.top = `${thisInputElBCR.height}px`;
                }
            }
        };
        this.selectNewValue = (item) => {
            // make displayable value
            if (item && typeof item === 'object') {
                item = this.setToStringFunction(item);
            }
            this.renderValue(item);
            // make return value
            let val = item;
            if (this.selectValueOf && item[this.selectValueOf]) {
                val = item[this.selectValueOf];
            }
            if ((this.parentForm && this.formControlName) || this.extFormControl) {
                if (!!val) {
                    this.formControl.patchValue(val);
                }
            }
            if (val !== this.ngModel) {
                this.ngModelChange.emit(val);
            }
            this.valueChanged.emit(val);
            this.hideAutoCompleteDropdown();
            setTimeout(() => {
                if (this.reFocusAfterSelect) {
                    this.inputEl.focus();
                }
                return this.inputEl;
            });
        };
        this.selectCustomValue = (text) => {
            this.customSelected.emit(text);
            this.hideAutoCompleteDropdown();
            setTimeout(() => {
                if (this.reFocusAfterSelect) {
                    this.inputEl.focus();
                }
                return this.inputEl;
            });
        };
        this.enterNewText = (value) => {
            this.renderValue(value);
            this.ngModelChange.emit(value);
            this.valueChanged.emit(value);
            this.hideAutoCompleteDropdown();
        };
        this.keydownEventHandler = (evt) => {
            if (this.componentRef) {
                const component = this.componentRef.instance;
                component.inputElKeyHandler(evt);
            }
        };
        this.inputEventHandler = (evt) => {
            if (this.componentRef) {
                const component = this.componentRef.instance;
                component.dropdownVisible = true;
                component.keyword = evt.target.value;
                component.reloadListInDelay(evt);
            }
            else {
                this.showAutoCompleteDropdown();
            }
        };
        this.el = this.viewContainerRef.element.nativeElement;
    }
    ngOnInit() {
        // Blur event is handled only after a click event.
        // This is to prevent handling of blur events resulting from interacting with a scrollbar
        // introduced by content overflow (Internet explorer issue).
        // See issue description here: http://stackoverflow.com/questions/2023779/clicking-on-a-divs-scroll-bar-fires-the-blur-event-in-ie
        this.documentClickListener = (e) => {
            if (this.scheduledBlurHandler) {
                this.scheduledBlurHandler();
                this.scheduledBlurHandler = null;
            }
        };
        document.addEventListener('click', this.documentClickListener);
        // wrap this element with <div class="ngui-auto-complete">
        this.wrapperEl = document.createElement('div');
        this.wrapperEl.className = 'ngui-auto-complete-wrapper';
        this.wrapperEl.style.position = 'relative';
        this.el.parentElement.insertBefore(this.wrapperEl, this.el.nextSibling);
        this.wrapperEl.appendChild(this.el);
        // Check if we were supplied with a [formControlName] and it is inside a [form]
        // else check if we are supplied with a [FormControl] regardless if it is inside a [form] tag
        if (this.parentForm && this.formControlName) {
            if (this.parentForm['form']) {
                this.formControl = this.parentForm['form'].get(this.formControlName);
            }
            else if (this.parentForm instanceof FormGroupName) {
                this.formControl = this.parentForm.control.controls[this.formControlName];
            }
        }
        else if (this.extFormControl) {
            this.formControl = this.extFormControl;
        }
        // apply toString() method for the object
        if (!!this.ngModel) {
            this.selectNewValue(this.ngModel);
        }
        else if (!!this.formControl && this.formControl.value) {
            this.selectNewValue(this.formControl.value);
        }
    }
    ngAfterViewInit() {
        // if this element is not an input tag, move dropdown after input tag
        // so that it displays correctly
        this.inputEl = this.el.tagName === 'INPUT' ? this.el : this.el.querySelector('input');
        if (this.openOnFocus) {
            this.inputEl.addEventListener('focus', (e) => this.showAutoCompleteDropdown(e));
        }
        if (this.closeOnFocusOut) {
            this.inputEl.addEventListener('focusout', (e) => this.hideAutoCompleteDropdown(e));
        }
        if (!this.autocomplete) {
            this.inputEl.setAttribute('autocomplete', 'off');
        }
        this.inputEl.addEventListener('blur', (e) => {
            this.scheduledBlurHandler = () => {
                return this.blurHandler(e);
            };
        });
        this.inputEl.addEventListener('keydown', (e) => this.keydownEventHandler(e));
        this.inputEl.addEventListener('input', (e) => this.inputEventHandler(e));
    }
    ngOnDestroy() {
        if (this.componentRef) {
            this.componentRef.instance.valueSelected.unsubscribe();
            this.componentRef.instance.textEntered.unsubscribe();
        }
        if (this.documentClickListener) {
            document.removeEventListener('click', this.documentClickListener);
        }
    }
    ngOnChanges(changes) {
        if (changes['ngModel']) {
            this.ngModel = this.setToStringFunction(changes['ngModel'].currentValue);
            this.renderValue(this.ngModel);
        }
    }
    blurHandler(event) {
        if (this.componentRef) {
            const component = this.componentRef.instance;
            if (this.selectOnBlur) {
                component.selectOne(component.filteredList[component.itemIndex]);
            }
            if (this.closeOnFocusOut) {
                this.hideAutoCompleteDropdown(event);
            }
        }
    }
    setToStringFunction(item) {
        if (item && typeof item === 'object') {
            let displayVal;
            if (typeof this.valueFormatter === 'string') {
                const matches = this.valueFormatter.match(/[a-zA-Z0-9_\$]+/g);
                let formatted = this.valueFormatter;
                if (matches && typeof item !== 'string') {
                    matches.forEach((key) => {
                        formatted = formatted.replace(key, item[key]);
                    });
                }
                displayVal = formatted;
            }
            else if (typeof this.valueFormatter === 'function') {
                displayVal = this.valueFormatter(item);
            }
            else if (this.displayPropertyName) {
                displayVal = item[this.displayPropertyName];
            }
            else if (typeof this.listFormatter === 'string' && this.listFormatter.match(/^\w+$/)) {
                displayVal = item[this.listFormatter];
            }
            else {
                displayVal = item.value;
            }
            item.toString = () => displayVal;
        }
        return item;
    }
    renderValue(item) {
        if (!!this.inputEl) {
            this.inputEl.value = '' + item;
        }
    }
}
NguiAutoCompleteDirective.decorators = [
    { type: Directive, args: [{
                // tslint:disable-next-line:directive-selector
                selector: '[auto-complete], [ngui-auto-complete]'
            },] }
];
NguiAutoCompleteDirective.ctorParameters = () => [
    { type: ComponentFactoryResolver },
    { type: ViewContainerRef },
    { type: ControlContainer, decorators: [{ type: Optional }, { type: Host }, { type: SkipSelf }] }
];
NguiAutoCompleteDirective.propDecorators = {
    autocomplete: [{ type: Input, args: ['autocomplete',] }],
    autoCompletePlaceholder: [{ type: Input, args: ['auto-complete-placeholder',] }],
    source: [{ type: Input, args: ['source',] }],
    pathToData: [{ type: Input, args: ['path-to-data',] }],
    minChars: [{ type: Input, args: ['min-chars',] }],
    displayPropertyName: [{ type: Input, args: ['display-property-name',] }],
    acceptUserInput: [{ type: Input, args: ['accept-user-input',] }],
    maxNumList: [{ type: Input, args: ['max-num-list',] }],
    selectValueOf: [{ type: Input, args: ['select-value-of',] }],
    loadingTemplate: [{ type: Input, args: ['loading-template',] }],
    listFormatter: [{ type: Input, args: ['list-formatter',] }],
    loadingText: [{ type: Input, args: ['loading-text',] }],
    blankOptionText: [{ type: Input, args: ['blank-option-text',] }],
    noMatchFoundText: [{ type: Input, args: ['no-match-found-text',] }],
    valueFormatter: [{ type: Input, args: ['value-formatter',] }],
    tabToSelect: [{ type: Input, args: ['tab-to-select',] }],
    selectOnBlur: [{ type: Input, args: ['select-on-blur',] }],
    matchFormatted: [{ type: Input, args: ['match-formatted',] }],
    autoSelectFirstItem: [{ type: Input, args: ['auto-select-first-item',] }],
    openOnFocus: [{ type: Input, args: ['open-on-focus',] }],
    closeOnFocusOut: [{ type: Input, args: ['close-on-focusout',] }],
    reFocusAfterSelect: [{ type: Input, args: ['re-focus-after-select',] }],
    headerItemTemplate: [{ type: Input, args: ['header-item-template',] }],
    ignoreAccents: [{ type: Input, args: ['ignore-accents',] }],
    ngModel: [{ type: Input }],
    formControlName: [{ type: Input, args: ['formControlName',] }],
    extFormControl: [{ type: Input, args: ['formControl',] }],
    zIndex: [{ type: Input, args: ['z-index',] }],
    isRtl: [{ type: Input, args: ['is-rtl',] }],
    ngModelChange: [{ type: Output }],
    valueChanged: [{ type: Output }],
    customSelected: [{ type: Output }]
};

class NguiAutoCompleteModule {
}
NguiAutoCompleteModule.decorators = [
    { type: NgModule, args: [{
                declarations: [
                    NguiAutoCompleteComponent,
                    NguiAutoCompleteDirective
                ],
                imports: [
                    CommonModule,
                    FormsModule
                ],
                exports: [
                    NguiAutoCompleteComponent,
                    NguiAutoCompleteDirective
                ]
            },] }
];

/*
 * Public API Surface of auto-complete
 */

/**
 * Generated bundle index. Do not edit.
 */

export { NguiAutoComplete, NguiAutoCompleteComponent, NguiAutoCompleteDirective, NguiAutoCompleteModule };
//# sourceMappingURL=ngui-auto-complete.js.map
