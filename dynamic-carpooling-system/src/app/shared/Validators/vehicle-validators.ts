import { AbstractControl, ValidationErrors } from '@angular/forms';

export class VehicleValidators {

    static validLicense(control: AbstractControl): ValidationErrors | null {
        const licensePlateFieldValue = (control.value || '').toString().trim();
        const licensePlatePattern = /^[A-Z]{2}[0-9]{2}[A-Z]{2}[0-9]{4}$/i;

        if (!licensePlateFieldValue) {
            return null;
        }

        if (!licensePlatePattern.test(licensePlateFieldValue)) {
            return {
                invalidLicense: true
            };

        }

        return null;
    }

    static maxSeats(
        control: AbstractControl
    ): ValidationErrors | null {
        const maxSeatsFieldValue = control.value;

        if (!maxSeatsFieldValue) {
            return null;
        }

        const isValidMaxSeats = Number.isInteger(maxSeatsFieldValue) &&
            maxSeatsFieldValue > 0 &&
            maxSeatsFieldValue <= 10;

        if (!isValidMaxSeats) {
            return {
                invalidSeats: true,
            };
        }

        return null;
    }
}
