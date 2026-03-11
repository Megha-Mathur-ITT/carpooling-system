import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Component } from '@angular/core';
import { CommonModule, NgIf } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { EmailValidators } from '../../../shared/Validators/email-validators';
import { UsernameValidators } from '../../../shared/Validators/username-validators';
import { PasswordValidators } from '../../../shared/Validators/password-validators';
import { VehicleValidators } from '../../../shared/Validators/vehicle-validators';
import { GeneralValidators } from '../../../shared/Validators/general-validators';
import { FormInput } from '../../../shared/ui/form-input/form-input';
import { ValidationMessages } from '../../../shared/constants/validation-messages';

import { AuthService } from '../../../core/services/auth-service';
import { RegisterRequest, UserRole } from '../../../core/models/auth-model';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    FormInput,
    NgIf,
    CommonModule,
    RouterLink,
    MatSnackBarModule
  ],
  providers: [MatSnackBar],
  templateUrl: './register.html',
  styleUrl: './register.scss',
})
export class Register {
  registrationForm!: FormGroup;
  registrationFormSubmitted = false;
  ValidationMessages = ValidationMessages;
  UserRole = UserRole;

  constructor(
    private formBuilder: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private snackBar: MatSnackBar,
  ) {
    this.buildRegistrationForm();
    this.handleRoleChanges();
  }

  private buildRegistrationForm(): void {
    this.registrationForm = this.formBuilder.group({
      email: ['', [Validators.required, EmailValidators.validEmail]],
      username: ['', [Validators.required, UsernameValidators.validUsername]],
      password: ['', [Validators.required, PasswordValidators.strongPassword]],
      confirmPassword: ['', Validators.required],
      role: ['passenger', Validators.required],

      vehicleName: [''],
      maxSeats: [''],
      vehicleLicense: ['']
    }, {
      validators: PasswordValidators.matchPassword('password', 'confirmPassword')
    });
  }

  private handleRoleChanges(): void {
    this.registrationForm.get('role')?.valueChanges.subscribe(role => {
      if (role === 'driver') {
        this.registrationForm.get('vehicleName')?.setValidators([Validators.required, GeneralValidators.noWhitespace]);
        this.registrationForm.get('maxSeats')?.setValidators([Validators.required, VehicleValidators.maxSeats]);
        this.registrationForm.get('vehicleLicense')?.setValidators([Validators.required, VehicleValidators.validLicense]);
      }
      else {
        this.registrationForm.get('vehicleName')?.clearValidators();
        this.registrationForm.get('maxSeats')?.clearValidators();
        this.registrationForm.get('vehicleLicense')?.clearValidators();
      }

      this.registrationForm.get('vehicleName')?.updateValueAndValidity();
      this.registrationForm.get('maxSeats')?.updateValueAndValidity();
      this.registrationForm.get('vehicleLicense')?.updateValueAndValidity();
    });
  }

  private buildPayload(): RegisterRequest {
    const formValue = this.registrationForm.value;

    if (formValue.role.toLowerCase() === "driver") {
      return {
        role: 2,
        email: formValue.email,
        username: formValue.username,
        password: formValue.password,
        vehicleName: formValue.vehicleName,
        maxSeats: Number(formValue.maxSeats),
        vehicleLicense: formValue.vehicleLicense,
        driverLicenseFile : this.base64File ?? "",
        driverLicenseFileName : this.selectedFile?.name ?? ""
      };
    }
    else {
      return {
        role: 1,
        email: formValue.email,
        username: formValue.username,
        password: formValue.password
      };
    }
  }

  onSubmit(): void {

    this.registrationFormSubmitted = true;

    if (this.registrationForm.invalid) {
      this.registrationForm.markAllAsTouched();
      return;
    }

    const payload = this.buildPayload();

    this.authService.register(payload).subscribe({
      next: () => {
        this.snackBar.open(
          "Registration successful! Redirecting to login...",
          "close",
          {
            duration: 3000,
            horizontalPosition: "center",
            verticalPosition: "top",
            panelClass: ['error-snackbar']
          }
        );

        setTimeout(() => {
          this.router.navigate(['/auth/login']);
        }, 5000);
      },
      error: (error) => {
        this.snackBar.open(
          error?.error?.error || "Registration failed.",
          "close",
          {
            duration: 3000,
            horizontalPosition: "center",
            verticalPosition: "top",
            panelClass: ['error-snackbar']
          }
        );
      }
    });
  }

  get getFormControls() {
    return this.registrationForm.controls;
  }

  selectedFile: File | null = null;
  base64File: string | null = null;

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;

      const reader = new FileReader();

      reader.onload = () => {
        const base64String = reader.result as string;
        this.base64File = base64String.split(',')[1];
      };

      reader.readAsDataURL(file);
    }

  }

  clearFile(input: HTMLInputElement) {
    input.value = '';
    this.selectedFile = null;
    this.base64File = null;
  }
}
