import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HotelAdminListComponent } from './hotel-admin-list';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

describe('HotelAdminListComponent', () => {
    let component: HotelAdminListComponent;
    let fixture: ComponentFixture<HotelAdminListComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [HotelAdminListComponent, HttpClientTestingModule, BrowserAnimationsModule]
        })
            .compileComponents();

        fixture = TestBed.createComponent(HotelAdminListComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
