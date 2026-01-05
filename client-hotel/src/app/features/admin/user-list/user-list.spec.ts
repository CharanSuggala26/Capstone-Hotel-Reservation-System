import { ComponentFixture, TestBed } from '@angular/core/testing';
import { UserListComponent } from './user-list';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

describe('UserListComponent', () => {
    let component: UserListComponent;
    let fixture: ComponentFixture<UserListComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [UserListComponent, HttpClientTestingModule, BrowserAnimationsModule]
        })
            .compileComponents();

        fixture = TestBed.createComponent(UserListComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
