(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('@angular/core'), require('@angular/common/http'), require('rxjs/operators'), require('@angular/forms'), require('@angular/common')) :
    typeof define === 'function' && define.amd ? define('@ngui/auto-complete', ['exports', '@angular/core', '@angular/common/http', 'rxjs/operators', '@angular/forms', '@angular/common'], factory) :
    (global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory((global.ngui = global.ngui || {}, global.ngui['auto-complete'] = {}), global.ng.core, global.ng.common.http, global.rxjs.operators, global.ng.forms, global.ng.common));
}(this, (function (exports, i0, i1, operators, forms, common) { 'use strict';

    var NguiAutoComplete = /** @class */ (function () {
        function NguiAutoComplete(http) {
            this.http = http;
            // ...
        }
        NguiAutoComplete.prototype.filter = function (list, keyword, matchFormatted, accentInsensitive) {
            var _this = this;
            return accentInsensitive
                ? list.filter(function (el) {
                    var objStr = matchFormatted ? _this.getFormattedListItem(el).toLowerCase() : JSON.stringify(el).toLowerCase();
                    keyword = keyword.toLowerCase();
                    return objStr.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
                        .indexOf(keyword.normalize('NFD').replace(/[\u0300-\u036f]/g, '')) !== -1;
                })
                : list.filter(function (el) {
                    var objStr = matchFormatted ? _this.getFormattedListItem(el).toLowerCase() : JSON.stringify(el).toLowerCase();
                    keyword = keyword.toLowerCase();
                    return objStr.indexOf(keyword) !== -1;
                });
        };
        NguiAutoComplete.prototype.getFormattedListItem = function (data) {
            var formatted;
            var formatter = this.listFormatter || '(id) value';
            if (typeof formatter === 'function') {
                formatted = formatter.apply(this, [data]);
            }
            else if (typeof data !== 'object') {
                formatted = data;
            }
            else if (typeof formatter === 'string') {
                formatted = formatter;
                var matches = formatter.match(/[a-zA-Z0-9_\$]+/g);
                if (matches && typeof data !== 'string') {
                    matches.forEach(function (key) {
                        formatted = formatted.replace(key, data[key]);
                    });
                }
            }
            return formatted;
        };
        /**
         * return remote data from the given source and options, and data path
         */
        NguiAutoComplete.prototype.getRemoteData = function (keyword) {
            var _this = this;
            if (typeof this.source !== 'string') {
                throw new TypeError('Invalid type of source, must be a string. e.g. http://www.google.com?q=:my_keyword');
            }
            else if (!this.http) {
                throw new Error('Http is required.');
            }
            var matches = this.source.match(/:[a-zA-Z_]+/);
            if (matches === null) {
                throw new Error('Replacement word is missing.');
            }
            var replacementWord = matches[0];
            var url = this.source.replace(replacementWord, keyword);
            return this.http.get(url)
                .pipe(operators.map(function (list) {
                if (_this.pathToData) {
                    var paths = _this.pathToData.split('.');
                    paths.forEach(function (prop) { return list = list[prop]; });
                }
                return list;
            }));
        };
        return NguiAutoComplete;
    }());
    NguiAutoComplete.ɵprov = i0.ɵɵdefineInjectable({ factory: function NguiAutoComplete_Factory() { return new NguiAutoComplete(i0.ɵɵinject(i1.HttpClient, 8)); }, token: NguiAutoComplete, providedIn: "root" });
    NguiAutoComplete.decorators = [
        { type: i0.Injectable, args: [{
                    providedIn: 'root'
                },] }
    ];
    NguiAutoComplete.ctorParameters = function () { return [
        { type: i1.HttpClient, decorators: [{ type: i0.Optional }] }
    ]; };

    var NguiAutoCompleteComponent = /** @class */ (function () {
        /**
         * constructor
         */
        function NguiAutoCompleteComponent(elementRef, autoComplete) {
            var _this = this;
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
            this.valueSelected = new i0.EventEmitter();
            this.customSelected = new i0.EventEmitter();
            this.textEntered = new i0.EventEmitter();
            this.dropdownVisible = false;
            this.isLoading = false;
            this.filteredList = [];
            this.minCharsEntered = false;
            this.itemIndex = null;
            this.timer = 0;
            this.delay = (function () {
                var timer = null;
                return function (callback, ms) {
                    clearTimeout(timer);
                    timer = setTimeout(callback, ms);
                };
            })();
            this.selectOnEnter = false;
            this.reloadListInDelay = function (evt) {
                var delayMs = _this.isSrcArr() ? 10 : 500;
                var keyword = evt.target.value;
                // executing after user stopped typing
                _this.delay(function () { return _this.reloadList(keyword); }, delayMs);
            };
            this.inputElKeyHandler = function (evt) {
                var totalNumItem = _this.filteredList.length;
                if (!_this.selectOnEnter && _this.autoSelectFirstItem && (0 !== totalNumItem)) {
                    _this.selectOnEnter = true;
                }
                switch (evt.keyCode) {
                    case 27: // ESC, hide auto complete
                        _this.selectOnEnter = false;
                        _this.selectOne(undefined);
                        break;
                    case 38: // UP, select the previous li el
                        if (0 === totalNumItem) {
                            return;
                        }
                        _this.selectOnEnter = true;
                        _this.itemIndex = (totalNumItem + _this.itemIndex - 1) % totalNumItem;
                        _this.scrollToView(_this.itemIndex);
                        break;
                    case 40: // DOWN, select the next li el or the first one
                        if (0 === totalNumItem) {
                            return;
                        }
                        _this.selectOnEnter = true;
                        _this.dropdownVisible = true;
                        var sum = _this.itemIndex;
                        sum = (_this.itemIndex === null) ? 0 : sum + 1;
                        _this.itemIndex = (totalNumItem + sum) % totalNumItem;
                        _this.scrollToView(_this.itemIndex);
                        break;
                    case 13: // ENTER, choose it!!
                        if (_this.selectOnEnter) {
                            _this.selectOne(_this.filteredList[_this.itemIndex]);
                        }
                        evt.preventDefault();
                        break;
                    case 9: // TAB, choose if tab-to-select is enabled
                        if (_this.tabToSelect) {
                            _this.selectOne(_this.filteredList[_this.itemIndex]);
                        }
                        break;
                }
            };
            this.el = elementRef.nativeElement;
        }
        /**
         * user enters into input el, shows list to select, then select one
         */
        NguiAutoCompleteComponent.prototype.ngOnInit = function () {
            var _this = this;
            this.autoComplete.source = this.source;
            this.autoComplete.pathToData = this.pathToData;
            this.autoComplete.listFormatter = this.listFormatter;
            if (this.autoSelectFirstItem) {
                this.itemIndex = 0;
            }
            setTimeout(function () {
                if (_this.autoCompleteInput && _this.reFocusAfterSelect) {
                    _this.autoCompleteInput.nativeElement.focus();
                }
                if (_this.showDropdownOnInit) {
                    _this.showDropdownList({ target: { value: '' } });
                }
            });
        };
        NguiAutoCompleteComponent.prototype.isSrcArr = function () {
            return Array.isArray(this.source);
        };
        NguiAutoCompleteComponent.prototype.showDropdownList = function (event) {
            this.dropdownVisible = true;
            this.reloadList(event.target.value);
        };
        NguiAutoCompleteComponent.prototype.hideDropdownList = function () {
            this.selectOnEnter = false;
            this.dropdownVisible = false;
        };
        NguiAutoCompleteComponent.prototype.findItemFromSelectValue = function (selectText) {
            var matchingItems = this.filteredList.filter(function (item) { return ('' + item) === selectText; });
            return matchingItems.length ? matchingItems[0] : null;
        };
        NguiAutoCompleteComponent.prototype.reloadList = function (keyword) {
            var _this = this;
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
                    this.source(keyword).subscribe(function (resp) {
                        if (_this.pathToData) {
                            var paths = _this.pathToData.split('.');
                            paths.forEach(function (prop) { return resp = resp[prop]; });
                        }
                        _this.filteredList = resp;
                        if (_this.maxNumList) {
                            _this.filteredList = _this.filteredList.slice(0, _this.maxNumList);
                        }
                    }, function (error) { return null; }, function () { return _this.isLoading = false; } // complete
                    );
                }
                else {
                    // remote source
                    this.autoComplete.getRemoteData(keyword).subscribe(function (resp) {
                        _this.filteredList = resp ? resp : [];
                        if (_this.maxNumList) {
                            _this.filteredList = _this.filteredList.slice(0, _this.maxNumList);
                        }
                    }, function (error) { return null; }, function () { return _this.isLoading = false; } // complete
                    );
                }
            }
        };
        NguiAutoCompleteComponent.prototype.selectOne = function (data) {
            if (!!data || data === '') {
                this.valueSelected.emit(data);
            }
            else {
                this.customSelected.emit(this.keyword);
            }
        };
        NguiAutoCompleteComponent.prototype.enterText = function (data) {
            this.textEntered.emit(data);
        };
        NguiAutoCompleteComponent.prototype.blurHandler = function (evt) {
            if (this.selectOnBlur) {
                this.selectOne(this.filteredList[this.itemIndex]);
            }
            this.hideDropdownList();
        };
        NguiAutoCompleteComponent.prototype.scrollToView = function (index) {
            var container = this.autoCompleteContainer.nativeElement;
            var ul = container.querySelector('ul');
            var li = ul.querySelector('li'); // just sample the first li to get height
            var liHeight = li.offsetHeight;
            var scrollTop = ul.scrollTop;
            var viewport = scrollTop + ul.offsetHeight;
            var scrollOffset = liHeight * index;
            if (scrollOffset < scrollTop || (scrollOffset + liHeight) > viewport) {
                ul.scrollTop = scrollOffset;
            }
        };
        NguiAutoCompleteComponent.prototype.trackByIndex = function (index, item) {
            return index;
        };
        Object.defineProperty(NguiAutoCompleteComponent.prototype, "emptyList", {
            get: function () {
                return !(this.isLoading ||
                    (this.minCharsEntered && !this.isLoading && !this.filteredList.length) ||
                    (this.filteredList.length));
            },
            enumerable: false,
            configurable: true
        });
        return NguiAutoCompleteComponent;
    }());
    NguiAutoCompleteComponent.decorators = [
        { type: i0.Component, args: [{
                    selector: 'ngui-auto-complete',
                    template: "\n    <div #autoCompleteContainer class=\"ngui-auto-complete\">\n      <!-- keyword input -->\n      <input *ngIf=\"showInputTag\"\n             #autoCompleteInput class=\"keyword\"\n             [attr.autocomplete]=\"autocomplete ? 'null' : 'off'\"\n             placeholder=\"{{placeholder}}\"\n             (focus)=\"showDropdownList($event)\"\n             (blur)=\"blurHandler($event)\"\n             (keydown)=\"inputElKeyHandler($event)\"\n             (input)=\"reloadListInDelay($event)\"\n             [(ngModel)]=\"keyword\"/>\n\n      <!-- dropdown that user can select -->\n      <ul *ngIf=\"dropdownVisible\" [class.empty]=\"emptyList\">\n        <li *ngIf=\"isLoading && loadingTemplate\" class=\"loading\"\n            [innerHTML]=\"loadingTemplate\"></li>\n        <li *ngIf=\"isLoading && !loadingTemplate\" class=\"loading\">{{loadingText}}</li>\n        <li *ngIf=\"minCharsEntered && !isLoading && !filteredList.length\"\n            (mousedown)=\"selectOne('')\"\n            class=\"no-match-found\">{{noMatchFoundText || 'No Result Found'}}\n        </li>\n        <li *ngIf=\"headerItemTemplate && filteredList.length\" class=\"header-item\"\n            [innerHTML]=\"headerItemTemplate\"></li>\n        <li *ngIf=\"blankOptionText && filteredList.length\"\n            (mousedown)=\"selectOne('')\"\n            class=\"blank-item\">{{blankOptionText}}\n        </li>\n        <li class=\"item\"\n            *ngFor=\"let item of filteredList; let i=index; trackBy: trackByIndex\"\n            (mousedown)=\"selectOne(item)\"\n            [ngClass]=\"{selected: i === itemIndex}\"\n            [innerHtml]=\"autoComplete.getFormattedListItem(item)\">\n        </li>\n      </ul>\n\n    </div>\n  ",
                    encapsulation: i0.ViewEncapsulation.None,
                    styles: ["\n    @keyframes slideDown {\n      0% {\n        transform: translateY(-10px);\n      }\n      100% {\n        transform: translateY(0px);\n      }\n    }\n\n    .ngui-auto-complete {\n      background-color: transparent;\n    }\n\n    .ngui-auto-complete > input {\n      outline: none;\n      border: 0;\n      padding: 2px;\n      box-sizing: border-box;\n      background-clip: content-box;\n    }\n\n    .ngui-auto-complete > ul {\n      background-color: #fff;\n      margin: 0;\n      width: 100%;\n      overflow-y: auto;\n      list-style-type: none;\n      padding: 0;\n      border: 1px solid #ccc;\n      box-sizing: border-box;\n      animation: slideDown 0.1s;\n    }\n\n    .ngui-auto-complete > ul.empty {\n      display: none;\n    }\n\n    .ngui-auto-complete > ul li {\n      padding: 2px 5px;\n      border-bottom: 1px solid #eee;\n    }\n\n    .ngui-auto-complete > ul li.selected {\n      background-color: #ccc;\n    }\n\n    .ngui-auto-complete > ul li:last-child {\n      border-bottom: none;\n    }\n\n    .ngui-auto-complete > ul li:not(.header-item):hover {\n      background-color: #ccc;\n    }"]
                },] }
    ];
    NguiAutoCompleteComponent.ctorParameters = function () { return [
        { type: i0.ElementRef },
        { type: NguiAutoComplete }
    ]; };
    NguiAutoCompleteComponent.propDecorators = {
        autocomplete: [{ type: i0.Input, args: ['autocomplete',] }],
        listFormatter: [{ type: i0.Input, args: ['list-formatter',] }],
        source: [{ type: i0.Input, args: ['source',] }],
        pathToData: [{ type: i0.Input, args: ['path-to-data',] }],
        minChars: [{ type: i0.Input, args: ['min-chars',] }],
        placeholder: [{ type: i0.Input, args: ['placeholder',] }],
        blankOptionText: [{ type: i0.Input, args: ['blank-option-text',] }],
        noMatchFoundText: [{ type: i0.Input, args: ['no-match-found-text',] }],
        acceptUserInput: [{ type: i0.Input, args: ['accept-user-input',] }],
        loadingText: [{ type: i0.Input, args: ['loading-text',] }],
        loadingTemplate: [{ type: i0.Input, args: ['loading-template',] }],
        maxNumList: [{ type: i0.Input, args: ['max-num-list',] }],
        showInputTag: [{ type: i0.Input, args: ['show-input-tag',] }],
        showDropdownOnInit: [{ type: i0.Input, args: ['show-dropdown-on-init',] }],
        tabToSelect: [{ type: i0.Input, args: ['tab-to-select',] }],
        matchFormatted: [{ type: i0.Input, args: ['match-formatted',] }],
        autoSelectFirstItem: [{ type: i0.Input, args: ['auto-select-first-item',] }],
        selectOnBlur: [{ type: i0.Input, args: ['select-on-blur',] }],
        reFocusAfterSelect: [{ type: i0.Input, args: ['re-focus-after-select',] }],
        headerItemTemplate: [{ type: i0.Input, args: ['header-item-template',] }],
        ignoreAccents: [{ type: i0.Input, args: ['ignore-accents',] }],
        valueSelected: [{ type: i0.Output }],
        customSelected: [{ type: i0.Output }],
        textEntered: [{ type: i0.Output }],
        autoCompleteInput: [{ type: i0.ViewChild, args: ['autoCompleteInput',] }],
        autoCompleteContainer: [{ type: i0.ViewChild, args: ['autoCompleteContainer',] }]
    };

    var NguiAutoCompleteDirective = /** @class */ (function () {
        function NguiAutoCompleteDirective(resolver, viewContainerRef, parentForm) {
            var _this = this;
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
            this.ngModelChange = new i0.EventEmitter();
            this.valueChanged = new i0.EventEmitter();
            this.customSelected = new i0.EventEmitter();
            // show auto-complete list below the current element
            this.showAutoCompleteDropdown = function (event) {
                if (_this.dropdownJustHidden) {
                    return;
                }
                _this.hideAutoCompleteDropdown();
                _this.scheduledBlurHandler = null;
                var factory = _this.resolver.resolveComponentFactory(NguiAutoCompleteComponent);
                _this.componentRef = _this.viewContainerRef.createComponent(factory);
                var component = _this.componentRef.instance;
                component.keyword = _this.inputEl.value;
                component.showInputTag = false; // Do NOT display autocomplete input tag separately
                component.pathToData = _this.pathToData;
                component.minChars = _this.minChars;
                component.source = _this.source;
                component.placeholder = _this.autoCompletePlaceholder;
                component.acceptUserInput = _this.acceptUserInput;
                component.maxNumList = parseInt(_this.maxNumList, 10);
                component.loadingText = _this.loadingText;
                component.loadingTemplate = _this.loadingTemplate;
                component.listFormatter = _this.listFormatter;
                component.blankOptionText = _this.blankOptionText;
                component.noMatchFoundText = _this.noMatchFoundText;
                component.tabToSelect = _this.tabToSelect;
                component.selectOnBlur = _this.selectOnBlur;
                component.matchFormatted = _this.matchFormatted;
                component.autoSelectFirstItem = _this.autoSelectFirstItem;
                component.headerItemTemplate = _this.headerItemTemplate;
                component.ignoreAccents = _this.ignoreAccents;
                component.valueSelected.subscribe(_this.selectNewValue);
                component.textEntered.subscribe(_this.enterNewText);
                component.customSelected.subscribe(_this.selectCustomValue);
                _this.acDropdownEl = _this.componentRef.location.nativeElement;
                _this.acDropdownEl.style.display = 'none';
                // if this element is not an input tag, move dropdown after input tag
                // so that it displays correctly
                // TODO: confirm with owners
                // with some reason, viewContainerRef.createComponent is creating element
                // to parent div which is created by us on ngOnInit, please try this with demo
                // if (this.el.tagName !== 'INPUT' && this.acDropdownEl) {
                _this.inputEl.parentElement.insertBefore(_this.acDropdownEl, _this.inputEl.nextSibling);
                // }
                _this.revertValue = typeof _this.ngModel !== 'undefined' ? _this.ngModel : _this.inputEl.value;
                setTimeout(function () {
                    component.reloadList(_this.inputEl.value);
                    _this.styleAutoCompleteDropdown();
                    component.dropdownVisible = true;
                });
            };
            this.hideAutoCompleteDropdown = function (event) {
                if (_this.componentRef) {
                    var currentItem = void 0;
                    var hasRevertValue = (typeof _this.revertValue !== 'undefined');
                    if (_this.inputEl && hasRevertValue && _this.acceptUserInput === false) {
                        currentItem = _this.componentRef.instance.findItemFromSelectValue(_this.inputEl.value);
                    }
                    _this.componentRef.destroy();
                    _this.componentRef = undefined;
                    if (_this.inputEl && hasRevertValue && _this.acceptUserInput === false && currentItem === null) {
                        _this.selectNewValue(_this.revertValue);
                    }
                    else if (_this.inputEl && _this.acceptUserInput === true && typeof currentItem === 'undefined' && event && event.target.value) {
                        _this.enterNewText(event.target.value);
                    }
                }
                _this.dropdownJustHidden = true;
                setTimeout(function () { return _this.dropdownJustHidden = false; }, 100);
            };
            this.styleAutoCompleteDropdown = function () {
                if (_this.componentRef) {
                    var component = _this.componentRef.instance;
                    /* setting width/height auto complete */
                    var thisElBCR = _this.el.getBoundingClientRect();
                    var thisInputElBCR = _this.inputEl.getBoundingClientRect();
                    var closeToBottom = thisInputElBCR.bottom + 100 > window.innerHeight;
                    var directionOfStyle = _this.isRtl ? 'right' : 'left';
                    _this.acDropdownEl.style.width = thisInputElBCR.width + 'px';
                    _this.acDropdownEl.style.position = 'absolute';
                    _this.acDropdownEl.style.zIndex = _this.zIndex;
                    _this.acDropdownEl.style[directionOfStyle] = '0';
                    _this.acDropdownEl.style.display = 'inline-block';
                    if (closeToBottom) {
                        _this.acDropdownEl.style.bottom = thisInputElBCR.height + "px";
                    }
                    else {
                        _this.acDropdownEl.style.top = thisInputElBCR.height + "px";
                    }
                }
            };
            this.selectNewValue = function (item) {
                // make displayable value
                if (item && typeof item === 'object') {
                    item = _this.setToStringFunction(item);
                }
                _this.renderValue(item);
                // make return value
                var val = item;
                if (_this.selectValueOf && item[_this.selectValueOf]) {
                    val = item[_this.selectValueOf];
                }
                if ((_this.parentForm && _this.formControlName) || _this.extFormControl) {
                    if (!!val) {
                        _this.formControl.patchValue(val);
                    }
                }
                if (val !== _this.ngModel) {
                    _this.ngModelChange.emit(val);
                }
                _this.valueChanged.emit(val);
                _this.hideAutoCompleteDropdown();
                setTimeout(function () {
                    if (_this.reFocusAfterSelect) {
                        _this.inputEl.focus();
                    }
                    return _this.inputEl;
                });
            };
            this.selectCustomValue = function (text) {
                _this.customSelected.emit(text);
                _this.hideAutoCompleteDropdown();
                setTimeout(function () {
                    if (_this.reFocusAfterSelect) {
                        _this.inputEl.focus();
                    }
                    return _this.inputEl;
                });
            };
            this.enterNewText = function (value) {
                _this.renderValue(value);
                _this.ngModelChange.emit(value);
                _this.valueChanged.emit(value);
                _this.hideAutoCompleteDropdown();
            };
            this.keydownEventHandler = function (evt) {
                if (_this.componentRef) {
                    var component = _this.componentRef.instance;
                    component.inputElKeyHandler(evt);
                }
            };
            this.inputEventHandler = function (evt) {
                if (_this.componentRef) {
                    var component = _this.componentRef.instance;
                    component.dropdownVisible = true;
                    component.keyword = evt.target.value;
                    component.reloadListInDelay(evt);
                }
                else {
                    _this.showAutoCompleteDropdown();
                }
            };
            this.el = this.viewContainerRef.element.nativeElement;
        }
        NguiAutoCompleteDirective.prototype.ngOnInit = function () {
            var _this = this;
            // Blur event is handled only after a click event.
            // This is to prevent handling of blur events resulting from interacting with a scrollbar
            // introduced by content overflow (Internet explorer issue).
            // See issue description here: http://stackoverflow.com/questions/2023779/clicking-on-a-divs-scroll-bar-fires-the-blur-event-in-ie
            this.documentClickListener = function (e) {
                if (_this.scheduledBlurHandler) {
                    _this.scheduledBlurHandler();
                    _this.scheduledBlurHandler = null;
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
                else if (this.parentForm instanceof forms.FormGroupName) {
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
        };
        NguiAutoCompleteDirective.prototype.ngAfterViewInit = function () {
            var _this = this;
            // if this element is not an input tag, move dropdown after input tag
            // so that it displays correctly
            this.inputEl = this.el.tagName === 'INPUT' ? this.el : this.el.querySelector('input');
            if (this.openOnFocus) {
                this.inputEl.addEventListener('focus', function (e) { return _this.showAutoCompleteDropdown(e); });
            }
            if (this.closeOnFocusOut) {
                this.inputEl.addEventListener('focusout', function (e) { return _this.hideAutoCompleteDropdown(e); });
            }
            if (!this.autocomplete) {
                this.inputEl.setAttribute('autocomplete', 'off');
            }
            this.inputEl.addEventListener('blur', function (e) {
                _this.scheduledBlurHandler = function () {
                    return _this.blurHandler(e);
                };
            });
            this.inputEl.addEventListener('keydown', function (e) { return _this.keydownEventHandler(e); });
            this.inputEl.addEventListener('input', function (e) { return _this.inputEventHandler(e); });
        };
        NguiAutoCompleteDirective.prototype.ngOnDestroy = function () {
            if (this.componentRef) {
                this.componentRef.instance.valueSelected.unsubscribe();
                this.componentRef.instance.textEntered.unsubscribe();
            }
            if (this.documentClickListener) {
                document.removeEventListener('click', this.documentClickListener);
            }
        };
        NguiAutoCompleteDirective.prototype.ngOnChanges = function (changes) {
            if (changes['ngModel']) {
                this.ngModel = this.setToStringFunction(changes['ngModel'].currentValue);
                this.renderValue(this.ngModel);
            }
        };
        NguiAutoCompleteDirective.prototype.blurHandler = function (event) {
            if (this.componentRef) {
                var component = this.componentRef.instance;
                if (this.selectOnBlur) {
                    component.selectOne(component.filteredList[component.itemIndex]);
                }
                if (this.closeOnFocusOut) {
                    this.hideAutoCompleteDropdown(event);
                }
            }
        };
        NguiAutoCompleteDirective.prototype.setToStringFunction = function (item) {
            if (item && typeof item === 'object') {
                var displayVal_1;
                if (typeof this.valueFormatter === 'string') {
                    var matches = this.valueFormatter.match(/[a-zA-Z0-9_\$]+/g);
                    var formatted_1 = this.valueFormatter;
                    if (matches && typeof item !== 'string') {
                        matches.forEach(function (key) {
                            formatted_1 = formatted_1.replace(key, item[key]);
                        });
                    }
                    displayVal_1 = formatted_1;
                }
                else if (typeof this.valueFormatter === 'function') {
                    displayVal_1 = this.valueFormatter(item);
                }
                else if (this.displayPropertyName) {
                    displayVal_1 = item[this.displayPropertyName];
                }
                else if (typeof this.listFormatter === 'string' && this.listFormatter.match(/^\w+$/)) {
                    displayVal_1 = item[this.listFormatter];
                }
                else {
                    displayVal_1 = item.value;
                }
                item.toString = function () { return displayVal_1; };
            }
            return item;
        };
        NguiAutoCompleteDirective.prototype.renderValue = function (item) {
            if (!!this.inputEl) {
                this.inputEl.value = '' + item;
            }
        };
        return NguiAutoCompleteDirective;
    }());
    NguiAutoCompleteDirective.decorators = [
        { type: i0.Directive, args: [{
                    // tslint:disable-next-line:directive-selector
                    selector: '[auto-complete], [ngui-auto-complete]'
                },] }
    ];
    NguiAutoCompleteDirective.ctorParameters = function () { return [
        { type: i0.ComponentFactoryResolver },
        { type: i0.ViewContainerRef },
        { type: forms.ControlContainer, decorators: [{ type: i0.Optional }, { type: i0.Host }, { type: i0.SkipSelf }] }
    ]; };
    NguiAutoCompleteDirective.propDecorators = {
        autocomplete: [{ type: i0.Input, args: ['autocomplete',] }],
        autoCompletePlaceholder: [{ type: i0.Input, args: ['auto-complete-placeholder',] }],
        source: [{ type: i0.Input, args: ['source',] }],
        pathToData: [{ type: i0.Input, args: ['path-to-data',] }],
        minChars: [{ type: i0.Input, args: ['min-chars',] }],
        displayPropertyName: [{ type: i0.Input, args: ['display-property-name',] }],
        acceptUserInput: [{ type: i0.Input, args: ['accept-user-input',] }],
        maxNumList: [{ type: i0.Input, args: ['max-num-list',] }],
        selectValueOf: [{ type: i0.Input, args: ['select-value-of',] }],
        loadingTemplate: [{ type: i0.Input, args: ['loading-template',] }],
        listFormatter: [{ type: i0.Input, args: ['list-formatter',] }],
        loadingText: [{ type: i0.Input, args: ['loading-text',] }],
        blankOptionText: [{ type: i0.Input, args: ['blank-option-text',] }],
        noMatchFoundText: [{ type: i0.Input, args: ['no-match-found-text',] }],
        valueFormatter: [{ type: i0.Input, args: ['value-formatter',] }],
        tabToSelect: [{ type: i0.Input, args: ['tab-to-select',] }],
        selectOnBlur: [{ type: i0.Input, args: ['select-on-blur',] }],
        matchFormatted: [{ type: i0.Input, args: ['match-formatted',] }],
        autoSelectFirstItem: [{ type: i0.Input, args: ['auto-select-first-item',] }],
        openOnFocus: [{ type: i0.Input, args: ['open-on-focus',] }],
        closeOnFocusOut: [{ type: i0.Input, args: ['close-on-focusout',] }],
        reFocusAfterSelect: [{ type: i0.Input, args: ['re-focus-after-select',] }],
        headerItemTemplate: [{ type: i0.Input, args: ['header-item-template',] }],
        ignoreAccents: [{ type: i0.Input, args: ['ignore-accents',] }],
        ngModel: [{ type: i0.Input }],
        formControlName: [{ type: i0.Input, args: ['formControlName',] }],
        extFormControl: [{ type: i0.Input, args: ['formControl',] }],
        zIndex: [{ type: i0.Input, args: ['z-index',] }],
        isRtl: [{ type: i0.Input, args: ['is-rtl',] }],
        ngModelChange: [{ type: i0.Output }],
        valueChanged: [{ type: i0.Output }],
        customSelected: [{ type: i0.Output }]
    };

    var NguiAutoCompleteModule = /** @class */ (function () {
        function NguiAutoCompleteModule() {
        }
        return NguiAutoCompleteModule;
    }());
    NguiAutoCompleteModule.decorators = [
        { type: i0.NgModule, args: [{
                    declarations: [
                        NguiAutoCompleteComponent,
                        NguiAutoCompleteDirective
                    ],
                    imports: [
                        common.CommonModule,
                        forms.FormsModule
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

    exports.NguiAutoComplete = NguiAutoComplete;
    exports.NguiAutoCompleteComponent = NguiAutoCompleteComponent;
    exports.NguiAutoCompleteDirective = NguiAutoCompleteDirective;
    exports.NguiAutoCompleteModule = NguiAutoCompleteModule;

    Object.defineProperty(exports, '__esModule', { value: true });

})));
//# sourceMappingURL=ngui-auto-complete.umd.js.map
