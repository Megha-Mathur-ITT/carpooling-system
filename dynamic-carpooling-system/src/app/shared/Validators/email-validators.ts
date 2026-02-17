import { AbstractControl, ValidationErrors } from "@angular/forms";

export class EmailValidators {
    static validEmail(
        control: AbstractControl,
    ): ValidationErrors | null {
        const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/i;
        const emailFieldValue = control.value;

        if (!emailFieldValue) {
            return null;
        }

        if (!emailPattern.test(emailFieldValue)) {
            return {
                invalidEmail: true
            };
        }

        return null;
    }
}
