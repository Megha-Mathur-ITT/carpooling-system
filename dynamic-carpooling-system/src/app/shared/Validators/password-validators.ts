import { AbstractControl, ValidationErrors, ValidatorFn } from "@angular/forms";

export class PasswordValidators {
    static strongPassword(
        contorl: AbstractControl
    ): ValidationErrors | null {
        const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;
        const passwordFieldValue = contorl.value.trim();

        if (!passwordFieldValue) {
            return null;
        }

        if (!passwordPattern.test(passwordFieldValue)) {
            return {
                weakPassword: true
            };
        }

        return null;
    }

    static matchPassword(
        passwordField: string,
        confirmPasswordField: string
    ): ValidatorFn {
        return (formGroup: AbstractControl): ValidationErrors | null => {
            const passwordControl = formGroup.get(passwordField);
            const confirmPasswordControl = formGroup.get(confirmPasswordField);

            if (!passwordControl || !confirmPasswordControl) {
                return null;
            }

            const passwordFieldValue = passwordControl.value;
            const confirmPasswordControlValue = confirmPasswordControl.value;

            if (!passwordFieldValue || !confirmPasswordControlValue) {
                return null;
            }

            if (passwordFieldValue != confirmPasswordControlValue) {
                return {
                    passwordMismatch: true
                };
            }

            return null;
        }
    }
}   