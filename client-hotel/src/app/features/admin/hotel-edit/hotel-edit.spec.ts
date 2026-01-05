import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HotelEditComponent } from './hotel-edit';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';

describe('HotelEditComponent', () => {
    let component: HotelEditComponent;
    let fixture: ComponentFixture<HotelEditComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [HotelEditComponent, HttpClientTestingModule, BrowserAnimationsModule],
            providers: [
                {
                    provide: ActivatedRoute,
                    useValue: { snapshot: { paramMap: { get: () => null } } }
                }
            ]
        })
            .compileComponents();

        fixture = TestBed.createComponent(HotelEditComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
