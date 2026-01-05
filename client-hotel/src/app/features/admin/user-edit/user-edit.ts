import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { UserService } from '../../../services/user';

@Component({
  selector: 'app-user-edit',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    MatSnackBarModule,
    RouterModule
  ],
  templateUrl: './user-edit.html',
  styleUrl: './user-edit.css'
})
export class UserEditComponent implements OnInit {
  userForm: FormGroup;
  userId: string | null = null;
  isEditMode = false;

  roles: string[] = ['Guest', 'Receptionist', 'HotelManager', 'Admin'];

  constructor(
    private fb: FormBuilder,
    private userService: UserService,
    private route: ActivatedRoute,
    private router: Router,
    private snackBar: MatSnackBar
  ) {
    this.userForm = this.fb.group({
      firstName: ['', [Validators.required]],
      lastName: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      phoneNumber: [''],
      roles: [[], [Validators.required]]
    });
  }

  ngOnInit(): void {
    this.userId = this.route.snapshot.paramMap.get('id');
    if (this.userId) {
      this.isEditMode = true;
      this.loadUser(this.userId);
      this.userForm.get('email')?.disable();
    }
  }

  loadUser(id: string): void {
    this.userService.getUser(id).subscribe({
      next: (response: any) => {
        const user = response.data || response;
        if (user) {
          this.userForm.patchValue({
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            phoneNumber: user.phoneNumber,
            roles: user.roles
          });
        }
      },
      error: (err) => console.error('Load User Error:', err)
    });
  }

  onSubmit(): void {
    if (this.userForm.valid && this.userId) {
      const formValue = this.userForm.getRawValue();

      const updateData = {
        firstName: formValue.firstName,
        lastName: formValue.lastName,
        phoneNumber: formValue.phoneNumber
      };

      this.userService.updateUser(this.userId, updateData).subscribe({
        next: () => {
          this.userService.promoteUser(this.userId!, formValue.roles).subscribe({
            next: () => {
              this.snackBar.open('User updated successfully!', 'Close', {
                duration: 3000,
                verticalPosition: 'top',
                horizontalPosition: 'center',
                panelClass: ['success-snackbar']
              });
              this.router.navigate(['/dashboard/admin/users']);
            },
            error: (err) => {
              console.error('Role Update Error:', err.error);
              this.snackBar.open(err.error?.message || 'Profile updated, but role update failed.', 'Close', {
                duration: 3000,
                verticalPosition: 'top',
                horizontalPosition: 'center',
                panelClass: ['warning-snackbar']
              });
            }
          });
        },
        error: (err) => {
          console.error('Profile Update Error:', err);
          this.snackBar.open('Failed to update user profile.', 'Close', {
            duration: 3000,
            verticalPosition: 'top',
            horizontalPosition: 'center',
            panelClass: ['error-snackbar']
          });
        }
      });
    }
  }
}