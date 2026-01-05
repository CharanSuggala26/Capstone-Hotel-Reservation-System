import { ComponentFixture, TestBed } from '@angular/core/testing';
import { UserEditComponent } from './user-edit';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';

describe('UserEditComponent', () => {
    let component: UserEditComponent;
    let fixture: ComponentFixture<UserEditComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [UserEditComponent, HttpClientTestingModule, BrowserAnimationsModule],
            providers: [
                {
                    provide: ActivatedRoute,
                    useValue: { snapshot: { paramMap: { get: () => null } } }
                }
            ]
        })
            .compileComponents();

        fixture = TestBed.createComponent(UserEditComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
