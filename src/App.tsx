import { format, formatDistanceStrict } from 'date-fns';
import { useNextPublicHoliday } from './useNextPublicHoliday';

function App() {
  const today = new Date();

  const nextPublicHoliday = useNextPublicHoliday('FI');

  return (
    <>
      <div>Today is</div>
      <ul>
        <li>
          {format(today, 'eeee')} of week {format(today, 'w')}
        </li>
        <li>
          the {format(today, 'do')} day of {format(today, 'MMMM')}
        </li>
        <li>
          the {format(today, 'Do')} day of the year {format(today, 'yyyy')}
        </li>
      </ul>
      {!!nextPublicHoliday && (
        <div>
          The next public holiday is coming in{' '}
          {formatDistanceStrict(nextPublicHoliday.date, today, { unit: 'day' })} on{' '}
          {format(nextPublicHoliday.date, 'MMMM dd yyyy')}
        </div>
      )}
    </>
  );
}

export default App;
