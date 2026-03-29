import { AbstractControl, ValidationErrors } from '@angular/forms';

export class UsernameValidators {

    static validUsername(
        control: AbstractControl
    ): ValidationErrors | null {
        const usernamePattern = /^[A-Za-z ]{2,}$/;
        const usernameFieldValue = (control.value || '').toString();

        if (!usernameFieldValue) {
            return null;
        }

        if (!usernamePattern.test(usernameFieldValue)) {
            return {
                invalidUsername: true,
            };
        }

        return null;
    }

}
