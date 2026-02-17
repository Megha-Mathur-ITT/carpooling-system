import { Component } from '@angular/core';
import { ReactiveFormsModule, FormGroup, FormBuilder, Validators } from '@angular/forms';
import { EmailValidators } from '../../../shared/Validators/email-validators';
import { PasswordValidators } from '../../../shared/Validators/password-validators';
import { UsernameValidators } from '../../../shared/Validators/username-validators';
import { VehicleValidators } from '../../../shared/Validators/vehicle-validators';
import { ValidationMessages } from '../../../shared/constants/validation-messages';
import { FormInput } from '../../../shared/ui/form-input/form-input';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    FormInput,
    RouterModule
  ],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})

export class Login {
  loginForm!: FormGroup;
  loginFormSubmitted = false;
  ValidationMessages = ValidationMessages;

  constructor(private formBuilder: FormBuilder) { }

  ngOnInit(): void {
    this.loginForm = this.formBuilder.group({
      email: ['', [Validators.required, EmailValidators.validEmail]],
      password: ['', [Validators.required, PasswordValidators.strongPassword]],
    });
  }

  onSubmit(): void {
    this.loginFormSubmitted = true;

    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }
  }

  get getFormControls() {
    return this.loginForm.controls;
  }
}
