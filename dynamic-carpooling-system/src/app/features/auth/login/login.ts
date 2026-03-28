import { Component } from '@angular/core';
import { ReactiveFormsModule, FormGroup, FormBuilder, Validators } from '@angular/forms';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { EmailValidators } from '../../../shared/Validators/email-validators';
import { PasswordValidators } from '../../../shared/Validators/password-validators';
import { ValidationMessages } from '../../../shared/constants/validation-messages';
import { FormInput } from '../../../shared/ui/form-input/form-input';
import { HttpClient } from '@angular/common/http';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth-service';
import { SignalrService } from '../../../core/services/signalr';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    FormInput,
    RouterModule,
    MatSnackBarModule,
    
  ],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})

export class Login {
  loginForm!: FormGroup;
  loginFormSubmitted = false;
  ValidationMessages = ValidationMessages;

  constructor(
    private formBuilder: FormBuilder,
    private http: HttpClient,
    private router: Router,
    private authService: AuthService,
    private snackBar: MatSnackBar,
    private signalrService: SignalrService
  ) {
    this.buildLoginForm();
  }

  private buildLoginForm() {
    this.loginForm = this.formBuilder.group({
      email: ['', [Validators.required, EmailValidators.validEmail]],
      password: ['', [Validators.required, PasswordValidators.strongPassword]],
    });
  }

  private buildPayload() {
    return {
      email: this.loginForm.value.email,
      password: this.loginForm.value.password,
    };
  }

  onSubmit(): void {
    this.loginFormSubmitted = true;

    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    const payload = this.buildPayload();

    debugger
    this.authService.login(payload).subscribe({
      next: () => {
        debugger
        this.signalrService.connect();
        
        this.snackBar.open("Login successful!", 'close', {
          duration: 3000,
          horizontalPosition: "center",
          verticalPosition: "top",
          panelClass: ['success-snackbar']
        });
        setTimeout(() => {
          this.router.navigate(['/']);
        }, 3000);
      },
      error: (err) => {
        this.snackBar.open(err.error?.error || "Login failed", "close", {
          duration: 3000,
          horizontalPosition: "center",
          verticalPosition: "top",
          panelClass: ['error-snackbar']
        });
      }
    });
  }

  get getFormControls() {
    return this.loginForm.controls; 
  }

  goToRegister() {
    this.router.navigate(['/auth/register'], { replaceUrl: true });
  }
}
