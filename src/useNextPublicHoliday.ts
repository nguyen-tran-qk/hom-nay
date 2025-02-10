import { useCallback, useEffect, useState } from 'react';
import { PublicHoliday } from './types';

export const useNextPublicHoliday = (countryCode: string) => {
  const [nextHoliday, setNextHoliday] = useState<PublicHoliday>();

  const fetchNextPublicHolidays = useCallback(async () => {
    const response = await fetch(`https://date.nager.at/api/v3/NextPublicHolidays/${countryCode}`, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
    });

    const data: PublicHoliday[] | undefined = await response.json();

    if (!data || !data.length) {
      setNextHoliday(undefined);

      return;
    }

    setNextHoliday(data[0]);
  }, [countryCode]);

  useEffect(() => {
    void fetchNextPublicHolidays();
  }, [fetchNextPublicHolidays]);

  return nextHoliday;
};
