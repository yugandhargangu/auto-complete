import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NguiAutoCompleteComponent } from './auto-complete.component';
import { NguiAutoCompleteDirective } from './auto-complete.directive';
export class NguiAutoCompleteModule {
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXV0by1jb21wbGV0ZS5tb2R1bGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi9wcm9qZWN0cy9hdXRvLWNvbXBsZXRlL3NyYy9saWIvYXV0by1jb21wbGV0ZS5tb2R1bGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsT0FBTyxFQUFFLFFBQVEsRUFBRSxNQUFNLGVBQWUsQ0FBQztBQUN6QyxPQUFPLEVBQUUsWUFBWSxFQUFFLE1BQU0saUJBQWlCLENBQUM7QUFDL0MsT0FBTyxFQUFFLFdBQVcsRUFBRSxNQUFNLGdCQUFnQixDQUFDO0FBQzdDLE9BQU8sRUFBRSx5QkFBeUIsRUFBRSxNQUFNLDJCQUEyQixDQUFDO0FBQ3RFLE9BQU8sRUFBRSx5QkFBeUIsRUFBRSxNQUFNLDJCQUEyQixDQUFDO0FBZ0J0RSxNQUFNLE9BQU8sc0JBQXNCOzs7WUFkbEMsUUFBUSxTQUFDO2dCQUNSLFlBQVksRUFBRTtvQkFDWix5QkFBeUI7b0JBQ3pCLHlCQUF5QjtpQkFDMUI7Z0JBQ0QsT0FBTyxFQUFFO29CQUNQLFlBQVk7b0JBQ1osV0FBVztpQkFDWjtnQkFDRCxPQUFPLEVBQUU7b0JBQ1AseUJBQXlCO29CQUN6Qix5QkFBeUI7aUJBQzFCO2FBQ0YiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBOZ01vZHVsZSB9IGZyb20gJ0Bhbmd1bGFyL2NvcmUnO1xuaW1wb3J0IHsgQ29tbW9uTW9kdWxlIH0gZnJvbSAnQGFuZ3VsYXIvY29tbW9uJztcbmltcG9ydCB7IEZvcm1zTW9kdWxlIH0gZnJvbSAnQGFuZ3VsYXIvZm9ybXMnO1xuaW1wb3J0IHsgTmd1aUF1dG9Db21wbGV0ZUNvbXBvbmVudCB9IGZyb20gJy4vYXV0by1jb21wbGV0ZS5jb21wb25lbnQnO1xuaW1wb3J0IHsgTmd1aUF1dG9Db21wbGV0ZURpcmVjdGl2ZSB9IGZyb20gJy4vYXV0by1jb21wbGV0ZS5kaXJlY3RpdmUnO1xuXG5ATmdNb2R1bGUoe1xuICBkZWNsYXJhdGlvbnM6IFtcbiAgICBOZ3VpQXV0b0NvbXBsZXRlQ29tcG9uZW50LFxuICAgIE5ndWlBdXRvQ29tcGxldGVEaXJlY3RpdmVcbiAgXSxcbiAgaW1wb3J0czogW1xuICAgIENvbW1vbk1vZHVsZSxcbiAgICBGb3Jtc01vZHVsZVxuICBdLFxuICBleHBvcnRzOiBbXG4gICAgTmd1aUF1dG9Db21wbGV0ZUNvbXBvbmVudCxcbiAgICBOZ3VpQXV0b0NvbXBsZXRlRGlyZWN0aXZlXG4gIF1cbn0pXG5leHBvcnQgY2xhc3MgTmd1aUF1dG9Db21wbGV0ZU1vZHVsZSB7IH1cbiJdfQ==