/**
 * Internal dependencies
 */
import { useLocalizedMoment } from 'calypso/components/localized-moment';
import {
	getDeltaActivities,
	getDeltaActivitiesByType,
	isActivityBackup,
	isSuccessfulRealtimeBackup,
} from 'calypso/lib/jetpack/backup-utils';
import { DELTA_ACTIVITIES, useActivityLogs, useFirstMatchingBackupAttempt } from '../hooks';

const useLatestBackupAttempt = ( siteId, { before, after, successOnly = false } = {} ) => {
	return useFirstMatchingBackupAttempt( siteId, {
		before,
		after,
		successOnly,
		sortOrder: 'desc',
	} );
};

const useBackupDeltas = ( siteId, { before, after, number = 1000 } = {}, shouldExecute = true ) => {
	const filter = {
		name: DELTA_ACTIVITIES,
		before: before ? before.toISOString() : undefined,
		after: after ? after.toISOString() : undefined,
		number,
	};

	const isValidRequest = filter.before && filter.after;

	const { isLoadingActivityLogs, activityLogs } = useActivityLogs(
		siteId,
		filter,
		!! ( isValidRequest && shouldExecute )
	);

	return {
		isLoadingDeltas: !! ( shouldExecute && isLoadingActivityLogs ),
		deltas: getDeltaActivitiesByType( activityLogs ),
	};
};

const useRawBackupDeltas = (
	siteId,
	{ before, after, number = 1000 } = {},
	shouldExecute = true
) => {
	const filter = {
		name: DELTA_ACTIVITIES,
		before: before ? before.toISOString() : undefined,
		after: after ? after.toISOString() : undefined,
		number,
	};

	const isValidRequest = filter.before && filter.after;

	const { isLoadingActivityLogs, activityLogs } = useActivityLogs(
		siteId,
		filter,
		!! ( isValidRequest && shouldExecute )
	);

	return {
		isLoadingDeltas: !! ( shouldExecute && isLoadingActivityLogs ),
		deltas: getDeltaActivities( activityLogs ),
	};
};

export const useDailyBackupStatus = ( siteId, selectedDate ) => {
	const moment = useLocalizedMoment();

	const lastBackupBeforeDate = useLatestBackupAttempt( siteId, {
		before: moment( selectedDate ).startOf( 'day' ),
		successOnly: true,
	} );
	const lastAttemptOnDate = useLatestBackupAttempt( siteId, {
		after: moment( selectedDate ).startOf( 'day' ),
		before: moment( selectedDate ).endOf( 'day' ),
	} );

	const mostRecentBackupEver = useLatestBackupAttempt( siteId, {
		successOnly: true,
	} );

	const hasPreviousBackup = ! lastBackupBeforeDate.isLoading && lastBackupBeforeDate.backupAttempt;
	const successfulLastAttempt =
		! lastAttemptOnDate.isLoading && lastAttemptOnDate.backupAttempt?.activityIsRewindable;

	const backupDeltas = useBackupDeltas(
		siteId,
		{
			after: moment( lastBackupBeforeDate.backupAttempt?.activityTs ),
			before: moment( lastAttemptOnDate.backupAttempt?.activityTs ),
		},
		!! ( hasPreviousBackup && successfulLastAttempt )
	);

	const rawBackupDeltas = useRawBackupDeltas(
		siteId,
		{
			after: moment( lastBackupBeforeDate.backupAttempt?.activityTs ),
			before: moment( lastAttemptOnDate.backupAttempt?.activityTs ),
		},
		!! ( hasPreviousBackup && successfulLastAttempt )
	);

	return {
		isLoading:
			mostRecentBackupEver.isLoading ||
			lastBackupBeforeDate.isLoading ||
			lastAttemptOnDate.isLoading ||
			backupDeltas.isLoading ||
			rawBackupDeltas.isLoading,
		mostRecentBackupEver: mostRecentBackupEver.backupAttempt,
		lastBackupBeforeDate: lastBackupBeforeDate.backupAttempt,
		lastBackupAttemptOnDate: lastAttemptOnDate.backupAttempt,
		deltas: backupDeltas.deltas,
		rawDeltas: rawBackupDeltas.deltas,
	};
};

export const useRealtimeBackupStatus = ( siteId, selectedDate ) => {
	const moment = useLocalizedMoment();

	const mostRecentBackupEver = useLatestBackupAttempt( siteId, {
		successOnly: true,
	} );

	const lastBackupBeforeDate = useLatestBackupAttempt( siteId, {
		before: moment( selectedDate ).startOf( 'day' ),
		successOnly: true,
	} );

	const { activityLogs, isLoadingActivityLogs } = useActivityLogs( siteId, {
		before: moment( selectedDate ).endOf( 'day' ).toISOString(),
		after: moment( selectedDate ).startOf( 'day' ).toISOString(),
	} );

	const backupAttemptsOnDate = activityLogs.filter(
		( activity ) => isActivityBackup( activity ) || isSuccessfulRealtimeBackup( activity )
	);
	const lastBackupAttemptOnDate = backupAttemptsOnDate[ 0 ];

	const hasPreviousBackup = ! lastBackupBeforeDate.isLoading && lastBackupBeforeDate.backupAttempt;
	const successfulLastAttempt =
		lastBackupAttemptOnDate && isSuccessfulRealtimeBackup( lastBackupAttemptOnDate );

	const rawDeltas = useRawBackupDeltas(
		siteId,
		{
			before: moment( lastBackupAttemptOnDate?.activityTs ),
			after: moment( lastBackupBeforeDate.backupAttempt?.activityTs ),
		},
		!! ( hasPreviousBackup && successfulLastAttempt )
	);

	return {
		isLoading:
			mostRecentBackupEver.isLoading ||
			lastBackupBeforeDate.isLoading ||
			isLoadingActivityLogs ||
			rawDeltas.isLoading,
		mostRecentBackupEver: mostRecentBackupEver.backupAttempt,
		lastBackupBeforeDate: lastBackupBeforeDate.backupAttempt,
		lastBackupAttemptOnDate: backupAttemptsOnDate[ 0 ],
		earlierBackupAttemptsOnDate: backupAttemptsOnDate?.slice?.( 1 ) || [],
		rawDeltas: rawDeltas.deltas,
	};
};
