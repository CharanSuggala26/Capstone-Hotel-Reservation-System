import { Component, OnInit, ChangeDetectorRef, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSortModule, MatSort } from '@angular/material/sort';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { FormsModule } from '@angular/forms';
import { UserService } from '../../../services/user';
import { UserDetailsDto } from '../../../models';

import { MatCardModule } from '@angular/material/card';

@Component({
    selector: 'app-user-list',
    standalone: true,
    imports: [
        CommonModule,
        RouterModule,
        MatTableModule,
        MatPaginatorModule,
        MatSortModule,
        MatButtonModule,
        MatIconModule,
        MatFormFieldModule,
        MatInputModule,
        MatSelectModule,
        MatCardModule,
        FormsModule
    ],
    templateUrl: './user-list.html',
    styleUrl: './user-list.css'
})
export class UserListComponent implements OnInit, AfterViewInit {
    displayedColumns: string[] = ['name', 'email', 'roles', 'actions'];
    dataSource = new MatTableDataSource<UserDetailsDto>();
    totalUsers = 0;
    pageSize = 10;
    pageIndex = 0;
    filterRole = '';

    @ViewChild(MatSort) sort!: MatSort;

    constructor(
        private readonly userService: UserService,
        private readonly router: Router,
        private readonly cdr: ChangeDetectorRef
    ) { }

    ngOnInit(): void {
        this.loadUsers();
    }

    ngAfterViewInit(): void {
        this.dataSource.sort = this.sort;
    }

    loadUsers(): void {
        this.userService.getAllUsers(this.pageIndex + 1, this.pageSize, this.filterRole || undefined)
            .subscribe((response: any) => {
                const data = response.data || response;
                if (data?.items) {
                    this.dataSource.data = data.items;
                    this.totalUsers = data.totalCount;
                    this.cdr.detectChanges();
                }
            });
    }

    onPageChange(event: PageEvent): void {
        this.pageIndex = event.pageIndex;
        this.pageSize = event.pageSize;
        this.loadUsers();
    }

    onRoleFilterChange(): void {
        this.pageIndex = 0;
        this.loadUsers();
    }

    deleteUser(userId: string): void {
        this.userService.deleteUser(userId).subscribe((response: any) => {
            if (response.success !== false) {
                this.loadUsers();
            }
        });
    }

    editUser(userId: string): void {
        this.router.navigate(['/dashboard/admin/users', userId, 'edit']);
    }
}
