import { router } from './trpc';
import { userRouter } from './routers/user';
import { lawnRouter } from './routers/lawn';
import { scheduleRouter } from './routers/schedule';
import { subscriptionRouter } from './routers/subscription';
import { weatherRouter } from './routers/weather';
import { recurringScheduleRouter } from './routers/recurring-schedule';
import { grassSpeciesRouter } from './routers/grass-species';

export const appRouter = router({
  user: userRouter,
  lawn: lawnRouter,
  schedule: scheduleRouter,
  subscription: subscriptionRouter,
  weather: weatherRouter,
  recurringSchedule: recurringScheduleRouter,
  grassSpecies: grassSpeciesRouter,
});

export type AppRouter = typeof appRouter;