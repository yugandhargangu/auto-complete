import { ElementRef, EventEmitter, OnInit } from '@angular/core';
import { NguiAutoComplete } from './auto-complete.service';
export declare class NguiAutoCompleteComponent implements OnInit {
    autoComplete: NguiAutoComplete;
    /**
     * public input properties
     */
    autocomplete: boolean;
    listFormatter: (arg: any) => string;
    source: any;
    pathToData: string;
    minChars: number;
    placeholder: string;
    blankOptionText: string;
    noMatchFoundText: string;
    acceptUserInput: boolean;
    loadingText: string;
    loadingTemplate: any;
    maxNumList: number;
    showInputTag: boolean;
    showDropdownOnInit: boolean;
    tabToSelect: boolean;
    matchFormatted: boolean;
    autoSelectFirstItem: boolean;
    selectOnBlur: boolean;
    reFocusAfterSelect: boolean;
    headerItemTemplate: any;
    ignoreAccents: boolean;
    valueSelected: EventEmitter<any>;
    customSelected: EventEmitter<any>;
    textEntered: EventEmitter<any>;
    autoCompleteInput: ElementRef;
    autoCompleteContainer: ElementRef;
    dropdownVisible: boolean;
    isLoading: boolean;
    filteredList: any[];
    minCharsEntered: boolean;
    itemIndex: number;
    keyword: string;
    private el;
    private timer;
    private delay;
    private selectOnEnter;
    /**
     * constructor
     */
    constructor(elementRef: ElementRef, autoComplete: NguiAutoComplete);
    /**
     * user enters into input el, shows list to select, then select one
     */
    ngOnInit(): void;
    isSrcArr(): boolean;
    reloadListInDelay: (evt: any) => void;
    showDropdownList(event: any): void;
    hideDropdownList(): void;
    findItemFromSelectValue(selectText: string): any;
    reloadList(keyword: string): void;
    selectOne(data: any): void;
    enterText(data: any): void;
    blurHandler(evt: any): void;
    inputElKeyHandler: (evt: any) => void;
    scrollToView(index: any): void;
    trackByIndex(index: any, item: any): any;
    get emptyList(): boolean;
}
