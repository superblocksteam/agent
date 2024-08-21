export class ScheduleConfig {
  frequency: number;
  interval: Interval;
  time: Date;
  dayOfMonth: number;
  // 7 bools, one for each day of week. Starting on Sunday.
  daysOfWeek: boolean[];
  // Added in order to compute locale timezone differences after/before DST
  // It will be missing for the old scheduled jobs and default to UTC
  timezoneLocale: string;

  constructor({
    frequency,
    interval,
    time,
    dayOfMonth,
    daysOfWeek,
    timezoneLocale: timezoneLocale
  }: {
    frequency: number;
    interval: Interval;
    time: Date;
    dayOfMonth: number;
    daysOfWeek: boolean[];
    timezoneLocale?: string;
  }) {
    this.frequency = frequency;
    this.interval = interval;
    this.time = time;
    this.dayOfMonth = dayOfMonth;
    this.daysOfWeek = daysOfWeek;
    this.timezoneLocale = timezoneLocale || 'UTC';
  }

  static validate(config: ScheduleConfig): { error: string | undefined } {
    const validIntervals = [Interval.Minute, Interval.Hour, Interval.Day, Interval.Week, Interval.Month];

    if (!Number.isInteger(config.frequency)) {
      return { error: 'Frequency should be an integer.' };
    }
    if (config.frequency < 0) {
      return { error: 'Frequency should be greater than 0.' };
    }
    if (!validIntervals.includes(config.interval)) {
      return { error: `Invalid interval ${config.interval}.` };
    }
    if (config.daysOfWeek.length !== 7) {
      return { error: `Invalid interval config daysOfWeek. ${config.daysOfWeek}` };
    }
    if (!config.dayOfMonth || !Number.isInteger(config.dayOfMonth)) {
      return { error: `Invalid dayOfMonth. ${config.dayOfMonth}` };
    }
    // TODO validate locale
    return { error: undefined };
  }

  static default(): ScheduleConfig {
    return new ScheduleConfig({
      frequency: 1,
      interval: Interval.Month,
      time: midnight(),
      dayOfMonth: 1,
      daysOfWeek: [true, false, false, false, false, false, false],
      // In Server, this would resolve to UTC, in UI to the local timezone
      timezoneLocale: Intl.DateTimeFormat().resolvedOptions().timeZone
    });
  }

  private cronDaysOfWeek(): string {
    const selectedDays = this.daysOfWeek.flatMap((bool, index) => (bool ? index : []));
    return selectedDays.length === 0 ? '*' : selectedDays.join(',');
  }

  private getLocalMinutesAndHoursAndDays(): [number, number] {
    // For historical reasons, we are saving the time in UTC. This is causing problem when we have DST changes
    // Ideally, instead of storing a datetime object, we should store hours and minutes in the local timezone
    // so that we can pass timezone to cron parser and it will take care of DST changes. This is basically
    // equavelant to storing a cron spec. Which we should do in the future.
    // For the time being, we are converting the time to the local timezone and then computing the minutes and hours
    // Here is how it works:
    //   * Get the local hours/minutes from the day the job was first created
    //      -> /E.g. UTC 23:00 is 19:00 in New York during DST, 18:00 otherwise
    //   * Add these local hours/minutes to cron expression
    //   * Tell cron expression that we want next run in a specific timezone
    //   * Cron expression decipher timezone and gives us a date which we store as UTC in Schedule table.
    const localTime = new Date(this.time.toLocaleString('en', { timeZone: this.timezoneLocale }));
    return [localTime.getMinutes(), localTime.getHours()];
  }

  // Currently, we use a cron evaluator to evaluate recurrence
  // expressions.
  toCron(): string {
    const [localMinutes, localHours] = this.getLocalMinutesAndHoursAndDays();
    switch (this.interval) {
      case Interval.Minute:
        // e.g. '*/2 * * *' -> every 2 minutes of the hour
        return `*/${this.frequency} * * * *`;
      case Interval.Hour:
        // 'mm */2 * * *' -> every 2 hours every day at mm
        return `${localMinutes} */${this.frequency} * * *`;
      case Interval.Day:
        // 'mm hh * * *' -> every day at hh:mm
        return `${localMinutes} ${localHours} * * *`;
      case Interval.Week:
        // 'mm hh * * 0,2' -> every week at hh:mm on Sunday and Tuesday
        return `${localMinutes} ${localHours} * * ${this.cronDaysOfWeek()}`;
      case Interval.Month:
        // 'mm hh dom */2 *' -> every 2 months on dom at hh:ss
        return `${localMinutes} ${localHours} ${this.dayOfMonth} */${this.frequency} *`;
    }
  }
}

export enum Interval {
  Minute = 'minute',
  Hour = 'hour',
  Day = 'day',
  Week = 'week',
  Month = 'month'
}

const midnight = (): Date => {
  const d = new Date();
  d.setHours(0);
  d.setMinutes(0);
  d.setSeconds(0);
  d.setMilliseconds(0);
  return d;
};

export enum ScheduleState {
  ACTIVE,
  PAUSED
}
