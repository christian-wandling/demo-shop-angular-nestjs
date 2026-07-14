import { ChangeDetectionStrategy, Component, input, InputSignal } from '@angular/core';
import { ValidationErrors } from '@angular/forms';

/**
 * Component that displays form validation error messages.
 *
 * This component renders error messages for form fields that fail validation.
 * It accepts the field name and validation errors as inputs and displays
 * appropriate error messages.
 *
 * @example
 * <lib-form-error
 *  [fieldName]="email"
 *  [errors]="form.controls.email.errors"/>
 */
@Component({
  selector: 'lib-form-error',
  standalone: true,
  imports: [],
  templateUrl: './form-error.component.html',
  styleUrl: './form-error.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'text-xs text-red-600',
  },
})
export class FormErrorComponent {
  /**
   * Name of the form field associated with the error.
   * This is used to identify which field the error belongs to.
   * Defaults to 'Field' if not provided.
   */
  readonly fieldName: InputSignal<string> = input<string>('Field');

  /**
   * Validation errors object containing error keys and their values.
   * This is typically obtained from Angular's FormControl.errors property.
   *
   * @required
   */
  readonly errors: InputSignal<ValidationErrors | null> = input.required<ValidationErrors | null>();
}
