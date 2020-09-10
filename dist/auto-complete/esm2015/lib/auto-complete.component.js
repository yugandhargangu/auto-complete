import { Component, ElementRef, EventEmitter, Input, Output, ViewChild, ViewEncapsulation } from '@angular/core';
import { NguiAutoComplete } from './auto-complete.service';
export class NguiAutoCompleteComponent {
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXV0by1jb21wbGV0ZS5jb21wb25lbnQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi9wcm9qZWN0cy9hdXRvLWNvbXBsZXRlL3NyYy9saWIvYXV0by1jb21wbGV0ZS5jb21wb25lbnQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsT0FBTyxFQUFFLFNBQVMsRUFBRSxVQUFVLEVBQUUsWUFBWSxFQUFFLEtBQUssRUFBVSxNQUFNLEVBQUUsU0FBUyxFQUFFLGlCQUFpQixFQUFFLE1BQU0sZUFBZSxDQUFDO0FBQ3pILE9BQU8sRUFBRSxnQkFBZ0IsRUFBRSxNQUFNLHlCQUF5QixDQUFDO0FBbUczRCxNQUFNLE9BQU8seUJBQXlCO0lBc0RwQzs7T0FFRztJQUNILFlBQVksVUFBc0IsRUFBUyxZQUE4QjtRQUE5QixpQkFBWSxHQUFaLFlBQVksQ0FBa0I7UUF2RHpFOztXQUVHO1FBQzJCLGlCQUFZLEdBQUcsS0FBSyxDQUFDO1FBSXhCLGFBQVEsR0FBRyxDQUFDLENBQUM7UUFJTCxvQkFBZSxHQUFHLElBQUksQ0FBQztRQUM1QixnQkFBVyxHQUFHLFNBQVMsQ0FBQztRQUNwQixvQkFBZSxHQUFHLElBQUksQ0FBQztRQUV6QixpQkFBWSxHQUFHLElBQUksQ0FBQztRQUNiLHVCQUFrQixHQUFHLEtBQUssQ0FBQztRQUNuQyxnQkFBVyxHQUFHLElBQUksQ0FBQztRQUNqQixtQkFBYyxHQUFHLEtBQUssQ0FBQztRQUNoQix3QkFBbUIsR0FBRyxLQUFLLENBQUM7UUFDcEMsaUJBQVksR0FBRyxLQUFLLENBQUM7UUFDZCx1QkFBa0IsR0FBRyxJQUFJLENBQUM7UUFDM0IsdUJBQWtCLEdBQUcsSUFBSSxDQUFDO1FBQ2hDLGtCQUFhLEdBQUcsSUFBSSxDQUFDO1FBRXBDLGtCQUFhLEdBQUcsSUFBSSxZQUFZLEVBQUUsQ0FBQztRQUNuQyxtQkFBYyxHQUFHLElBQUksWUFBWSxFQUFFLENBQUM7UUFDcEMsZ0JBQVcsR0FBRyxJQUFJLFlB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Ozs7R0FxQ1Q7Z0JBd0RELGFBQWEsRUFBRSxpQkFBaUIsQ0FBQyxJQUFJO3lCQXZENUI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O01BcURMO2FBR0w7OztZQW5HbUIsVUFBVTtZQUNyQixnQkFBZ0I7OzsyQkF3R3RCLEtBQUssU0FBQyxjQUFjOzRCQUNwQixLQUFLLFNBQUMsZ0JBQWdCO3FCQUN0QixLQUFLLFNBQUMsUUFBUTt5QkFDZCxLQUFLLFNBQUMsY0FBYzt1QkFDcEIsS0FBSyxTQUFDLFdBQVc7MEJBQ2pCLEtBQUssU0FBQyxhQUFhOzhCQUNuQixLQUFLLFNBQUMsbUJBQW1COytCQUN6QixLQUFLLFNBQUMscUJBQXFCOzhCQUMzQixLQUFLLFNBQUMsbUJBQW1COzBCQUN6QixLQUFLLFNBQUMsY0FBYzs4QkFDcEIsS0FBSyxTQUFDLGtCQUFrQjt5QkFDeEIsS0FBSyxTQUFDLGNBQWM7MkJBQ3BCLEtBQUssU0FBQyxnQkFBZ0I7aUNBQ3RCLEtBQUssU0FBQyx1QkFBdUI7MEJBQzdCLEtBQUssU0FBQyxlQUFlOzZCQUNyQixLQUFLLFNBQUMsaUJBQWlCO2tDQUN2QixLQUFLLFNBQUMsd0JBQXdCOzJCQUM5QixLQUFLLFNBQUMsZ0JBQWdCO2lDQUN0QixLQUFLLFNBQUMsdUJBQXVCO2lDQUM3QixLQUFLLFNBQUMsc0JBQXNCOzRCQUM1QixLQUFLLFNBQUMsZ0JBQWdCOzRCQUV0QixNQUFNOzZCQUNOLE1BQU07MEJBQ04sTUFBTTtnQ0FFTixTQUFTLFNBQUMsbUJBQW1CO29DQUM3QixTQUFTLFNBQUMsdUJBQXVCIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgQ29tcG9uZW50LCBFbGVtZW50UmVmLCBFdmVudEVtaXR0ZXIsIElucHV0LCBPbkluaXQsIE91dHB1dCwgVmlld0NoaWxkLCBWaWV3RW5jYXBzdWxhdGlvbiB9IGZyb20gJ0Bhbmd1bGFyL2NvcmUnO1xuaW1wb3J0IHsgTmd1aUF1dG9Db21wbGV0ZSB9IGZyb20gJy4vYXV0by1jb21wbGV0ZS5zZXJ2aWNlJztcblxuQENvbXBvbmVudCh7XG4gIHNlbGVjdG9yOiAnbmd1aS1hdXRvLWNvbXBsZXRlJyxcbiAgdGVtcGxhdGU6IGBcbiAgICA8ZGl2ICNhdXRvQ29tcGxldGVDb250YWluZXIgY2xhc3M9XCJuZ3VpLWF1dG8tY29tcGxldGVcIj5cbiAgICAgIDwhLS0ga2V5d29yZCBpbnB1dCAtLT5cbiAgICAgIDxpbnB1dCAqbmdJZj1cInNob3dJbnB1dFRhZ1wiXG4gICAgICAgICAgICAgI2F1dG9Db21wbGV0ZUlucHV0IGNsYXNzPVwia2V5d29yZFwiXG4gICAgICAgICAgICAgW2F0dHIuYXV0b2NvbXBsZXRlXT1cImF1dG9jb21wbGV0ZSA/ICdudWxsJyA6ICdvZmYnXCJcbiAgICAgICAgICAgICBwbGFjZWhvbGRlcj1cInt7cGxhY2Vob2xkZXJ9fVwiXG4gICAgICAgICAgICAgKGZvY3VzKT1cInNob3dEcm9wZG93bkxpc3QoJGV2ZW50KVwiXG4gICAgICAgICAgICAgKGJsdXIpPVwiYmx1ckhhbmRsZXIoJGV2ZW50KVwiXG4gICAgICAgICAgICAgKGtleWRvd24pPVwiaW5wdXRFbEtleUhhbmRsZXIoJGV2ZW50KVwiXG4gICAgICAgICAgICAgKGlucHV0KT1cInJlbG9hZExpc3RJbkRlbGF5KCRldmVudClcIlxuICAgICAgICAgICAgIFsobmdNb2RlbCldPVwia2V5d29yZFwiLz5cblxuICAgICAgPCEtLSBkcm9wZG93biB0aGF0IHVzZXIgY2FuIHNlbGVjdCAtLT5cbiAgICAgIDx1bCAqbmdJZj1cImRyb3Bkb3duVmlzaWJsZVwiIFtjbGFzcy5lbXB0eV09XCJlbXB0eUxpc3RcIj5cbiAgICAgICAgPGxpICpuZ0lmPVwiaXNMb2FkaW5nICYmIGxvYWRpbmdUZW1wbGF0ZVwiIGNsYXNzPVwibG9hZGluZ1wiXG4gICAgICAgICAgICBbaW5uZXJIVE1MXT1cImxvYWRpbmdUZW1wbGF0ZVwiPjwvbGk+XG4gICAgICAgIDxsaSAqbmdJZj1cImlzTG9hZGluZyAmJiAhbG9hZGluZ1RlbXBsYXRlXCIgY2xhc3M9XCJsb2FkaW5nXCI+e3tsb2FkaW5nVGV4dH19PC9saT5cbiAgICAgICAgPGxpICpuZ0lmPVwibWluQ2hhcnNFbnRlcmVkICYmICFpc0xvYWRpbmcgJiYgIWZpbHRlcmVkTGlzdC5sZW5ndGhcIlxuICAgICAgICAgICAgKG1vdXNlZG93bik9XCJzZWxlY3RPbmUoJycpXCJcbiAgICAgICAgICAgIGNsYXNzPVwibm8tbWF0Y2gtZm91bmRcIj57e25vTWF0Y2hGb3VuZFRleHQgfHwgJ05vIFJlc3VsdCBGb3VuZCd9fVxuICAgICAgICA8L2xpPlxuICAgICAgICA8bGkgKm5nSWY9XCJoZWFkZXJJdGVtVGVtcGxhdGUgJiYgZmlsdGVyZWRMaXN0Lmxlbmd0aFwiIGNsYXNzPVwiaGVhZGVyLWl0ZW1cIlxuICAgICAgICAgICAgW2lubmVySFRNTF09XCJoZWFkZXJJdGVtVGVtcGxhdGVcIj48L2xpPlxuICAgICAgICA8bGkgKm5nSWY9XCJibGFua09wdGlvblRleHQgJiYgZmlsdGVyZWRMaXN0Lmxlbmd0aFwiXG4gICAgICAgICAgICAobW91c2Vkb3duKT1cInNlbGVjdE9uZSgnJylcIlxuICAgICAgICAgICAgY2xhc3M9XCJibGFuay1pdGVtXCI+e3tibGFua09wdGlvblRleHR9fVxuICAgICAgICA8L2xpPlxuICAgICAgICA8bGkgY2xhc3M9XCJpdGVtXCJcbiAgICAgICAgICAgICpuZ0Zvcj1cImxldCBpdGVtIG9mIGZpbHRlcmVkTGlzdDsgbGV0IGk9aW5kZXg7IHRyYWNrQnk6IHRyYWNrQnlJbmRleFwiXG4gICAgICAgICAgICAobW91c2Vkb3duKT1cInNlbGVjdE9uZShpdGVtKVwiXG4gICAgICAgICAgICBbbmdDbGFzc109XCJ7c2VsZWN0ZWQ6IGkgPT09IGl0ZW1JbmRleH1cIlxuICAgICAgICAgICAgW2lubmVySHRtbF09XCJhdXRvQ29tcGxldGUuZ2V0Rm9ybWF0dGVkTGlzdEl0ZW0oaXRlbSlcIj5cbiAgICAgICAgPC9saT5cbiAgICAgIDwvdWw+XG5cbiAgICA8L2Rpdj5cbiAgYCxcbiAgc3R5bGVzOiBbYFxuICAgIEBrZXlmcmFtZXMgc2xpZGVEb3duIHtcbiAgICAgIDAlIHtcbiAgICAgICAgdHJhbnNmb3JtOiB0cmFuc2xhdGVZKC0xMHB4KTtcbiAgICAgIH1cbiAgICAgIDEwMCUge1xuICAgICAgICB0cmFuc2Zvcm06IHRyYW5zbGF0ZVkoMHB4KTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICAubmd1aS1hdXRvLWNvbXBsZXRlIHtcbiAgICAgIGJhY2tncm91bmQtY29sb3I6IHRyYW5zcGFyZW50O1xuICAgIH1cblxuICAgIC5uZ3VpLWF1dG8tY29tcGxldGUgPiBpbnB1dCB7XG4gICAgICBvdXRsaW5lOiBub25lO1xuICAgICAgYm9yZGVyOiAwO1xuICAgICAgcGFkZGluZzogMnB4O1xuICAgICAgYm94LXNpemluZzogYm9yZGVyLWJveDtcbiAgICAgIGJhY2tncm91bmQtY2xpcDogY29udGVudC1ib3g7XG4gICAgfVxuXG4gICAgLm5ndWktYXV0by1jb21wbGV0ZSA+IHVsIHtcbiAgICAgIGJhY2tncm91bmQtY29sb3I6ICNmZmY7XG4gICAgICBtYXJnaW46IDA7XG4gICAgICB3aWR0aDogMTAwJTtcbiAgICAgIG92ZXJmbG93LXk6IGF1dG87XG4gICAgICBsaXN0LXN0eWxlLXR5cGU6IG5vbmU7XG4gICAgICBwYWRkaW5nOiAwO1xuICAgICAgYm9yZGVyOiAxcHggc29saWQgI2NjYztcbiAgICAgIGJveC1zaXppbmc6IGJvcmRlci1ib3g7XG4gICAgICBhbmltYXRpb246IHNsaWRlRG93biAwLjFzO1xuICAgIH1cblxuICAgIC5uZ3VpLWF1dG8tY29tcGxldGUgPiB1bC5lbXB0eSB7XG4gICAgICBkaXNwbGF5OiBub25lO1xuICAgIH1cblxuICAgIC5uZ3VpLWF1dG8tY29tcGxldGUgPiB1bCBsaSB7XG4gICAgICBwYWRkaW5nOiAycHggNXB4O1xuICAgICAgYm9yZGVyLWJvdHRvbTogMXB4IHNvbGlkICNlZWU7XG4gICAgfVxuXG4gICAgLm5ndWktYXV0by1jb21wbGV0ZSA+IHVsIGxpLnNlbGVjdGVkIHtcbiAgICAgIGJhY2tncm91bmQtY29sb3I6ICNjY2M7XG4gICAgfVxuXG4gICAgLm5ndWktYXV0by1jb21wbGV0ZSA+IHVsIGxpOmxhc3QtY2hpbGQge1xuICAgICAgYm9yZGVyLWJvdHRvbTogbm9uZTtcbiAgICB9XG5cbiAgICAubmd1aS1hdXRvLWNvbXBsZXRlID4gdWwgbGk6bm90KC5oZWFkZXItaXRlbSk6aG92ZXIge1xuICAgICAgYmFja2dyb3VuZC1jb2xvcjogI2NjYztcbiAgICB9YFxuICBdLFxuICBlbmNhcHN1bGF0aW9uOiBWaWV3RW5jYXBzdWxhdGlvbi5Ob25lXG59KVxuZXhwb3J0IGNsYXNzIE5ndWlBdXRvQ29tcGxldGVDb21wb25lbnQgaW1wbGVtZW50cyBPbkluaXQge1xuXG4gIC8qKlxuICAgKiBwdWJsaWMgaW5wdXQgcHJvcGVydGllc1xuICAgKi9cbiAgQElucHV0KCdhdXRvY29tcGxldGUnKSBwdWJsaWMgYXV0b2NvbXBsZXRlID0gZmFsc2U7XG4gIEBJbnB1dCgnbGlzdC1mb3JtYXR0ZXInKSBwdWJsaWMgbGlzdEZvcm1hdHRlcjogKGFyZzogYW55KSA9PiBzdHJpbmc7XG4gIEBJbnB1dCgnc291cmNlJykgcHVibGljIHNvdXJjZTogYW55O1xuICBASW5wdXQoJ3BhdGgtdG8tZGF0YScpIHB1YmxpYyBwYXRoVG9EYXRhOiBzdHJpbmc7XG4gIEBJbnB1dCgnbWluLWNoYXJzJykgcHVibGljIG1pbkNoYXJzID0gMDtcbiAgQElucHV0KCdwbGFjZWhvbGRlcicpIHB1YmxpYyBwbGFjZWhvbGRlcjogc3RyaW5nO1xuICBASW5wdXQoJ2JsYW5rLW9wdGlvbi10ZXh0JykgcHVibGljIGJsYW5rT3B0aW9uVGV4dDogc3RyaW5nO1xuICBASW5wdXQoJ25vLW1hdGNoLWZvdW5kLXRleHQnKSBwdWJsaWMgbm9NYXRjaEZvdW5kVGV4dDogc3RyaW5nO1xuICBASW5wdXQoJ2FjY2VwdC11c2VyLWlucHV0JykgcHVibGljIGFjY2VwdFVzZXJJbnB1dCA9IHRydWU7XG4gIEBJbnB1dCgnbG9hZGluZy10ZXh0JykgcHVibGljIGxvYWRpbmdUZXh0ID0gJ0xvYWRpbmcnO1xuICBASW5wdXQoJ2xvYWRpbmctdGVtcGxhdGUnKSBwdWJsaWMgbG9hZGluZ1RlbXBsYXRlID0gbnVsbDtcbiAgQElucHV0KCdtYXgtbnVtLWxpc3QnKSBwdWJsaWMgbWF4TnVtTGlzdDogbnVtYmVyO1xuICBASW5wdXQoJ3Nob3ctaW5wdXQtdGFnJykgcHVibGljIHNob3dJbnB1dFRhZyA9IHRydWU7XG4gIEBJbnB1dCgnc2hvdy1kcm9wZG93bi1vbi1pbml0JykgcHVibGljIHNob3dEcm9wZG93bk9uSW5pdCA9IGZhbHNlO1xuICBASW5wdXQoJ3RhYi10by1zZWxlY3QnKSBwdWJsaWMgdGFiVG9TZWxlY3QgPSB0cnVlO1xuICBASW5wdXQoJ21hdGNoLWZvcm1hdHRlZCcpIHB1YmxpYyBtYXRjaEZvcm1hdHRlZCA9IGZhbHNlO1xuICBASW5wdXQoJ2F1dG8tc2VsZWN0LWZpcnN0LWl0ZW0nKSBwdWJsaWMgYXV0b1NlbGVjdEZpcnN0SXRlbSA9IGZhbHNlO1xuICBASW5wdXQoJ3NlbGVjdC1vbi1ibHVyJykgcHVibGljIHNlbGVjdE9uQmx1ciA9IGZhbHNlO1xuICBASW5wdXQoJ3JlLWZvY3VzLWFmdGVyLXNlbGVjdCcpIHB1YmxpYyByZUZvY3VzQWZ0ZXJTZWxlY3QgPSB0cnVlO1xuICBASW5wdXQoJ2hlYWRlci1pdGVtLXRlbXBsYXRlJykgcHVibGljIGhlYWRlckl0ZW1UZW1wbGF0ZSA9IG51bGw7XG4gIEBJbnB1dCgnaWdub3JlLWFjY2VudHMnKSBwdWJsaWMgaWdub3JlQWNjZW50cyA9IHRydWU7XG5cbiAgQE91dHB1dCgpIHB1YmxpYyB2YWx1ZVNlbGVjdGVkID0gbmV3IEV2ZW50RW1pdHRlcigpO1xuICBAT3V0cHV0KCkgcHVibGljIGN1c3RvbVNlbGVjdGVkID0gbmV3IEV2ZW50RW1pdHRlcigpO1xuICBAT3V0cHV0KCkgcHVibGljIHRleHRFbnRlcmVkID0gbmV3IEV2ZW50RW1pdHRlcigpO1xuXG4gIEBWaWV3Q2hpbGQoJ2F1dG9Db21wbGV0ZUlucHV0JykgcHVibGljIGF1dG9Db21wbGV0ZUlucHV0OiBFbGVtZW50UmVmO1xuICBAVmlld0NoaWxkKCdhdXRvQ29tcGxldGVDb250YWluZXInKSBwdWJsaWMgYXV0b0NvbXBsZXRlQ29udGFpbmVyOiBFbGVtZW50UmVmO1xuXG4gIHB1YmxpYyBkcm9wZG93blZpc2libGUgPSBmYWxzZTtcbiAgcHVibGljIGlzTG9hZGluZyA9IGZhbHNlO1xuXG4gIHB1YmxpYyBmaWx0ZXJlZExpc3Q6IGFueVtdID0gW107XG4gIHB1YmxpYyBtaW5DaGFyc0VudGVyZWQgPSBmYWxzZTtcbiAgcHVibGljIGl0ZW1JbmRleDogbnVtYmVyID0gbnVsbDtcbiAgcHVibGljIGtleXdvcmQ6IHN0cmluZztcblxuICBwcml2YXRlIGVsOiBIVE1MRWxlbWVudDsgICAgICAgICAgIC8vIHRoaXMgY29tcG9uZW50ICBlbGVtZW50IGA8bmd1aS1hdXRvLWNvbXBsZXRlPmBcbiAgcHJpdmF0ZSB0aW1lciA9IDA7XG5cbiAgcHJpdmF0ZSBkZWxheSA9ICgoKSA9PiB7XG4gICAgbGV0IHRpbWVyID0gbnVsbDtcbiAgICByZXR1cm4gKGNhbGxiYWNrOiBhbnksIG1zOiBudW1iZXIpID0+IHtcbiAgICAgIGNsZWFyVGltZW91dCh0aW1lcik7XG4gICAgICB0aW1lciA9IHNldFRpbWVvdXQoY2FsbGJhY2ssIG1zKTtcbiAgICB9O1xuICB9KSgpO1xuICBwcml2YXRlIHNlbGVjdE9uRW50ZXIgPSBmYWxzZTtcblxuICAvKipcbiAgICogY29uc3RydWN0b3JcbiAgICovXG4gIGNvbnN0cnVjdG9yKGVsZW1lbnRSZWY6IEVsZW1lbnRSZWYsIHB1YmxpYyBhdXRvQ29tcGxldGU6IE5ndWlBdXRvQ29tcGxldGUpIHtcbiAgICB0aGlzLmVsID0gZWxlbWVudFJlZi5uYXRpdmVFbGVtZW50O1xuICB9XG5cbiAgLyoqXG4gICAqIHVzZXIgZW50ZXJzIGludG8gaW5wdXQgZWwsIHNob3dzIGxpc3QgdG8gc2VsZWN0LCB0aGVuIHNlbGVjdCBvbmVcbiAgICovXG4gIG5nT25Jbml0KCk6IHZvaWQge1xuICAgIHRoaXMuYXV0b0NvbXBsZXRlLnNvdXJjZSA9IHRoaXMuc291cmNlO1xuICAgIHRoaXMuYXV0b0NvbXBsZXRlLnBhdGhUb0RhdGEgPSB0aGlzLnBhdGhUb0RhdGE7XG4gICAgdGhpcy5hdXRvQ29tcGxldGUubGlzdEZvcm1hdHRlciA9IHRoaXMubGlzdEZvcm1hdHRlcjtcbiAgICBpZiAodGhpcy5hdXRvU2VsZWN0Rmlyc3RJdGVtKSB7XG4gICAgICB0aGlzLml0ZW1JbmRleCA9IDA7XG4gICAgfVxuICAgIHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgaWYgKHRoaXMuYXV0b0NvbXBsZXRlSW5wdXQgJiYgdGhpcy5yZUZvY3VzQWZ0ZXJTZWxlY3QpIHtcbiAgICAgICAgdGhpcy5hdXRvQ29tcGxldGVJbnB1dC5uYXRpdmVFbGVtZW50LmZvY3VzKCk7XG4gICAgICB9XG4gICAgICBpZiAodGhpcy5zaG93RHJvcGRvd25PbkluaXQpIHtcbiAgICAgICAgdGhpcy5zaG93RHJvcGRvd25MaXN0KHt0YXJnZXQ6IHt2YWx1ZTogJyd9fSk7XG4gICAgICB9XG4gICAgfSk7XG4gIH1cblxuICBwdWJsaWMgaXNTcmNBcnIoKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIEFycmF5LmlzQXJyYXkodGhpcy5zb3VyY2UpO1xuICB9XG5cbiAgcHVibGljIHJlbG9hZExpc3RJbkRlbGF5ID0gKGV2dDogYW55KTogdm9pZCA9PiB7XG4gICAgY29uc3QgZGVsYXlNcyA9IHRoaXMuaXNTcmNBcnIoKSA/IDEwIDogNTAwO1xuICAgIGNvbnN0IGtleXdvcmQgPSBldnQudGFyZ2V0LnZhbHVlO1xuXG4gICAgLy8gZXhlY3V0aW5nIGFmdGVyIHVzZXIgc3RvcHBlZCB0eXBpbmdcbiAgICB0aGlzLmRlbGF5KCgpID0+IHRoaXMucmVsb2FkTGlzdChrZXl3b3JkKSwgZGVsYXlNcyk7XG4gIH1cblxuICBwdWJsaWMgc2hvd0Ryb3Bkb3duTGlzdChldmVudDogYW55KTogdm9pZCB7XG4gICAgdGhpcy5kcm9wZG93blZpc2libGUgPSB0cnVlO1xuICAgIHRoaXMucmVsb2FkTGlzdChldmVudC50YXJnZXQudmFsdWUpO1xuICB9XG5cbiAgcHVibGljIGhpZGVEcm9wZG93bkxpc3QoKTogdm9pZCB7XG4gICAgdGhpcy5zZWxlY3RPbkVudGVyID0gZmFsc2U7XG4gICAgdGhpcy5kcm9wZG93blZpc2libGUgPSBmYWxzZTtcbiAgfVxuXG4gIHB1YmxpYyBmaW5kSXRlbUZyb21TZWxlY3RWYWx1ZShzZWxlY3RUZXh0OiBzdHJpbmcpOiBhbnkge1xuICAgIGNvbnN0IG1hdGNoaW5nSXRlbXMgPSB0aGlzLmZpbHRlcmVkTGlzdC5maWx0ZXIoKGl0ZW0pID0+ICgnJyArIGl0ZW0pID09PSBzZWxlY3RUZXh0KTtcbiAgICByZXR1cm4gbWF0Y2hpbmdJdGVtcy5sZW5ndGggPyBtYXRjaGluZ0l0ZW1zWzBdIDogbnVsbDtcbiAgfVxuXG4gIHB1YmxpYyByZWxvYWRMaXN0KGtleXdvcmQ6IHN0cmluZyk6IHZvaWQge1xuXG4gICAgdGhpcy5maWx0ZXJlZExpc3QgPSBbXTtcbiAgICBpZiAoa2V5d29yZC5sZW5ndGggPCAodGhpcy5taW5DaGFycyB8fCAwKSkge1xuICAgICAgdGhpcy5taW5DaGFyc0VudGVyZWQgPSBmYWxzZTtcbiAgICAgIHJldHVybjtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5taW5DaGFyc0VudGVyZWQgPSB0cnVlO1xuICAgIH1cblxuICAgIGlmICh0aGlzLmlzU3JjQXJyKCkpIHsgICAgLy8gbG9jYWwgc291cmNlXG4gICAgICB0aGlzLmlzTG9hZGluZyA9IGZhbHNlO1xuICAgICAgdGhpcy5maWx0ZXJlZExpc3QgPSB0aGlzLmF1dG9Db21wbGV0ZS5maWx0ZXIodGhpcy5zb3VyY2UsIGtleXdvcmQsIHRoaXMubWF0Y2hGb3JtYXR0ZWQsIHRoaXMuaWdub3JlQWNjZW50cyk7XG4gICAgICBpZiAodGhpcy5tYXhOdW1MaXN0KSB7XG4gICAgICAgIHRoaXMuZmlsdGVyZWRMaXN0ID0gdGhpcy5maWx0ZXJlZExpc3Quc2xpY2UoMCwgdGhpcy5tYXhOdW1MaXN0KTtcbiAgICAgIH1cblxuICAgIH0gZWxzZSB7ICAgICAgICAgICAgICAgICAvLyByZW1vdGUgc291cmNlXG4gICAgICB0aGlzLmlzTG9hZGluZyA9IHRydWU7XG5cbiAgICAgIGlmICh0eXBlb2YgdGhpcy5zb3VyY2UgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgLy8gY3VzdG9tIGZ1bmN0aW9uIHRoYXQgcmV0dXJucyBvYnNlcnZhYmxlXG4gICAgICAgIHRoaXMuc291cmNlKGtleXdvcmQpLnN1YnNjcmliZShcbiAgICAgICAgICAocmVzcCkgPT4ge1xuXG4gICAgICAgICAgICBpZiAodGhpcy5wYXRoVG9EYXRhKSB7XG4gICAgICAgICAgICAgIGNvbnN0IHBhdGhzID0gdGhpcy5wYXRoVG9EYXRhLnNwbGl0KCcuJyk7XG4gICAgICAgICAgICAgIHBhdGhzLmZvckVhY2goKHByb3ApID0+IHJlc3AgPSByZXNwW3Byb3BdKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdGhpcy5maWx0ZXJlZExpc3QgPSByZXNwO1xuICAgICAgICAgICAgaWYgKHRoaXMubWF4TnVtTGlzdCkge1xuICAgICAgICAgICAgICB0aGlzLmZpbHRlcmVkTGlzdCA9IHRoaXMuZmlsdGVyZWRMaXN0LnNsaWNlKDAsIHRoaXMubWF4TnVtTGlzdCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSxcbiAgICAgICAgICAoZXJyb3IpID0+IG51bGwsXG4gICAgICAgICAgKCkgPT4gdGhpcy5pc0xvYWRpbmcgPSBmYWxzZSAvLyBjb21wbGV0ZVxuICAgICAgICApO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgLy8gcmVtb3RlIHNvdXJjZVxuXG4gICAgICAgIHRoaXMuYXV0b0NvbXBsZXRlLmdldFJlbW90ZURhdGEoa2V5d29yZCkuc3Vic2NyaWJlKChyZXNwKSA9PiB7XG4gICAgICAgICAgICB0aGlzLmZpbHRlcmVkTGlzdCA9IHJlc3AgPyByZXNwIDogW107XG4gICAgICAgICAgICBpZiAodGhpcy5tYXhOdW1MaXN0KSB7XG4gICAgICAgICAgICAgIHRoaXMuZmlsdGVyZWRMaXN0ID0gdGhpcy5maWx0ZXJlZExpc3Quc2xpY2UoMCwgdGhpcy5tYXhOdW1MaXN0KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9LFxuICAgICAgICAgIChlcnJvcikgPT4gbnVsbCxcbiAgICAgICAgICAoKSA9PiB0aGlzLmlzTG9hZGluZyA9IGZhbHNlIC8vIGNvbXBsZXRlXG4gICAgICAgICk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgcHVibGljIHNlbGVjdE9uZShkYXRhOiBhbnkpIHtcbiAgICBpZiAoISFkYXRhIHx8IGRhdGEgPT09ICcnKSB7XG4gICAgICB0aGlzLnZhbHVlU2VsZWN0ZWQuZW1pdChkYXRhKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5jdXN0b21TZWxlY3RlZC5lbWl0KHRoaXMua2V5d29yZCk7XG4gICAgfVxuICB9XG5cbiAgcHVibGljIGVudGVyVGV4dChkYXRhOiBhbnkpIHtcbiAgICB0aGlzLnRleHRFbnRlcmVkLmVtaXQoZGF0YSk7XG4gIH1cblxuICBwdWJsaWMgYmx1ckhhbmRsZXIoZXZ0OiBhbnkpIHtcbiAgICBpZiAodGhpcy5zZWxlY3RPbkJsdXIpIHtcbiAgICAgIHRoaXMuc2VsZWN0T25lKHRoaXMuZmlsdGVyZWRMaXN0W3RoaXMuaXRlbUluZGV4XSk7XG4gICAgfVxuXG4gICAgdGhpcy5oaWRlRHJvcGRvd25MaXN0KCk7XG4gIH1cblxuICBwdWJsaWMgaW5wdXRFbEtleUhhbmRsZXIgPSAoZXZ0OiBhbnkpID0+IHtcbiAgICBjb25zdCB0b3RhbE51bUl0ZW0gPSB0aGlzLmZpbHRlcmVkTGlzdC5sZW5ndGg7XG5cbiAgICBpZiAoIXRoaXMuc2VsZWN0T25FbnRlciAmJiB0aGlzLmF1dG9TZWxlY3RGaXJzdEl0ZW0gJiYgKDAgIT09IHRvdGFsTnVtSXRlbSkpIHtcbiAgICAgIHRoaXMuc2VsZWN0T25FbnRlciA9IHRydWU7XG4gICAgfVxuXG4gICAgc3dpdGNoIChldnQua2V5Q29kZSkge1xuICAgICAgY2FzZSAyNzogLy8gRVNDLCBoaWRlIGF1dG8gY29tcGxldGVcbiAgICAgICAgdGhpcy5zZWxlY3RPbkVudGVyID0gZmFsc2U7XG4gICAgICAgIHRoaXMuc2VsZWN0T25lKHVuZGVmaW5lZCk7XG4gICAgICAgIGJyZWFrO1xuXG4gICAgICBjYXNlIDM4OiAvLyBVUCwgc2VsZWN0IHRoZSBwcmV2aW91cyBsaSBlbFxuICAgICAgICBpZiAoMCA9PT0gdG90YWxOdW1JdGVtKSB7XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuc2VsZWN0T25FbnRlciA9IHRydWU7XG4gICAgICAgIHRoaXMuaXRlbUluZGV4ID0gKHRvdGFsTnVtSXRlbSArIHRoaXMuaXRlbUluZGV4IC0gMSkgJSB0b3RhbE51bUl0ZW07XG4gICAgICAgIHRoaXMuc2Nyb2xsVG9WaWV3KHRoaXMuaXRlbUluZGV4KTtcbiAgICAgICAgYnJlYWs7XG5cbiAgICAgIGNhc2UgNDA6IC8vIERPV04sIHNlbGVjdCB0aGUgbmV4dCBsaSBlbCBvciB0aGUgZmlyc3Qgb25lXG4gICAgICAgIGlmICgwID09PSB0b3RhbE51bUl0ZW0pIHtcbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5zZWxlY3RPbkVudGVyID0gdHJ1ZTtcbiAgICAgICAgdGhpcy5kcm9wZG93blZpc2libGUgPSB0cnVlO1xuICAgICAgICBsZXQgc3VtID0gdGhpcy5pdGVtSW5kZXg7XG4gICAgICAgIHN1bSA9ICh0aGlzLml0ZW1JbmRleCA9PT0gbnVsbCkgPyAwIDogc3VtICsgMTtcbiAgICAgICAgdGhpcy5pdGVtSW5kZXggPSAodG90YWxOdW1JdGVtICsgc3VtKSAlIHRvdGFsTnVtSXRlbTtcbiAgICAgICAgdGhpcy5zY3JvbGxUb1ZpZXcodGhpcy5pdGVtSW5kZXgpO1xuICAgICAgICBicmVhaztcblxuICAgICAgY2FzZSAxMzogLy8gRU5URVIsIGNob29zZSBpdCEhXG4gICAgICAgIGlmICh0aGlzLnNlbGVjdE9uRW50ZXIpIHtcbiAgICAgICAgICB0aGlzLnNlbGVjdE9uZSh0aGlzLmZpbHRlcmVkTGlzdFt0aGlzLml0ZW1JbmRleF0pO1xuICAgICAgICB9XG4gICAgICAgIGV2dC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICBicmVhaztcblxuICAgICAgY2FzZSA5OiAvLyBUQUIsIGNob29zZSBpZiB0YWItdG8tc2VsZWN0IGlzIGVuYWJsZWRcbiAgICAgICAgaWYgKHRoaXMudGFiVG9TZWxlY3QpIHtcbiAgICAgICAgICB0aGlzLnNlbGVjdE9uZSh0aGlzLmZpbHRlcmVkTGlzdFt0aGlzLml0ZW1JbmRleF0pO1xuICAgICAgICB9XG4gICAgICAgIGJyZWFrO1xuICAgIH1cbiAgfVxuXG4gIHB1YmxpYyBzY3JvbGxUb1ZpZXcoaW5kZXgpIHtcbiAgICBjb25zdCBjb250YWluZXIgPSB0aGlzLmF1dG9Db21wbGV0ZUNvbnRhaW5lci5uYXRpdmVFbGVtZW50O1xuICAgIGNvbnN0IHVsID0gY29udGFpbmVyLnF1ZXJ5U2VsZWN0b3IoJ3VsJyk7XG4gICAgY29uc3QgbGkgPSB1bC5xdWVyeVNlbGVjdG9yKCdsaScpOyAgLy8ganVzdCBzYW1wbGUgdGhlIGZpcnN0IGxpIHRvIGdldCBoZWlnaHRcbiAgICBjb25zdCBsaUhlaWdodCA9IGxpLm9mZnNldEhlaWdodDtcbiAgICBjb25zdCBzY3JvbGxUb3AgPSB1bC5zY3JvbGxUb3A7XG4gICAgY29uc3Qgdmlld3BvcnQgPSBzY3JvbGxUb3AgKyB1bC5vZmZzZXRIZWlnaHQ7XG4gICAgY29uc3Qgc2Nyb2xsT2Zmc2V0ID0gbGlIZWlnaHQgKiBpbmRleDtcbiAgICBpZiAoc2Nyb2xsT2Zmc2V0IDwgc2Nyb2xsVG9wIHx8IChzY3JvbGxPZmZzZXQgKyBsaUhlaWdodCkgPiB2aWV3cG9ydCkge1xuICAgICAgdWwuc2Nyb2xsVG9wID0gc2Nyb2xsT2Zmc2V0O1xuICAgIH1cbiAgfVxuXG4gIHB1YmxpYyB0cmFja0J5SW5kZXgoaW5kZXgsIGl0ZW0pIHtcbiAgICByZXR1cm4gaW5kZXg7XG4gIH1cblxuICBnZXQgZW1wdHlMaXN0KCk6IGJvb2xlYW4ge1xuICAgIHJldHVybiAhKFxuICAgICAgdGhpcy5pc0xvYWRpbmcgfHxcbiAgICAgICh0aGlzLm1pbkNoYXJzRW50ZXJlZCAmJiAhdGhpcy5pc0xvYWRpbmcgJiYgIXRoaXMuZmlsdGVyZWRMaXN0Lmxlbmd0aCkgfHxcbiAgICAgICh0aGlzLmZpbHRlcmVkTGlzdC5sZW5ndGgpXG4gICAgKTtcbiAgfVxuXG59XG4iXX0=