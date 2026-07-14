import { ChangeDetectionStrategy, Component, input, InputSignal } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * A component that displays a formatted date and time.
 *
 * This component takes a date input and formats it according to the provided pattern
 * and timezone. It uses Angular's standalone component architecture with OnPush change
 * detection for optimal performance.
 *
 * @example
 * <lib-date-time
 *   [dateTime]="myDate"
 *   [pattern]="'yyyy-MM-dd'"
 *   [timezone]="'America/New_York'"/>
 */
@Component({
  selector: 'lib-date-time',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './date-time.component.html',
  styleUrl: './date-time.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    'data-testid': 'date-time',
  },
})
export class DateTimeComponent {
  /**
   * The date and time value to be displayed.
   *
   * This required input accepts either a Date object or a string that can be
   * parsed into a date. The component will format this value according to the
   * specified pattern and timezone.
   *
   * @required
   */
  readonly dateTime: InputSignal<Date | string> = input.required<Date | string>();

  /**
   * The formatting pattern to apply to the date and time value.
   *
   * Uses the format pattern syntax supported by your date formatting library.
   * Default value is 'MMM dd, yyyy' which produces outputs like 'Mar 17, 2025'.
   */
  readonly pattern: InputSignal<string> = input<string>('MMM dd, yyyy');

  /**
   * The timezone to use when displaying the date and time.
   *
   * Should be a valid IANA timezone identifier (e.g., 'UTC', 'America/New_York').
   * Default value is 'UTC'.
   */
  readonly timezone: InputSignal<string> = input<string>('UTC');
}
