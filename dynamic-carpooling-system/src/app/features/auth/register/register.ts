import { Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { EmailValidators } from '../../../shared/Validators/email-validators';
import { UsernameValidators } from '../../../shared/Validators/username-validators';
import { PasswordValidators } from '../../../shared/Validators/password-validators';
import { VehicleValidators } from '../../../shared/Validators/vehicle-validators';
import { GeneralValidators } from '../../../shared/Validators/general-validators';
import { FormInput } from '../../../shared/ui/form-input/form-input';
import { NgIf } from '@angular/common';
import { ValidationMessages } from '../../../shared/constants/validation-messages';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    FormInput,
    NgIf,
    RouterModule
  ],

  templateUrl: './register.html',
  styleUrl: './register.scss',
})
export class Register {
  registrationForm!: FormGroup;
  registrationFormSubmitted = false;
  ValidationMessages = ValidationMessages;

  constructor(private formBuilder: FormBuilder) { }

  ngOnInit(): void {
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
    })
  }

  onSubmit(): void {
    this.registrationFormSubmitted = true;

    if (this.registrationForm.invalid) {
      this.registrationForm.markAllAsTouched();
      return;
    }
  }

  get getFormControls() {
    return this.registrationForm.controls;
  }
}
