/**
 * Thank with Google Main Setup component.
 *
 * Site Kit by Google, Copyright 2021 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * External dependencies
 */
import PropTypes from 'prop-types';

/**
 * WordPress dependencies
 */
import { Fragment, useCallback, useEffect } from '@wordpress/element';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import { ProgressBar } from 'googlesitekit-components';
import StoreErrorNotices from '../../../../components/StoreErrorNotices';
import { useRefocus } from '../../../../hooks/useRefocus';
import useViewContext from '../../../../hooks/useViewContext';
import { trackEvent } from '../../../../util';
import {
	MODULES_THANK_WITH_GOOGLE,
	ONBOARDING_STATE_ACTION_REQUIRED,
	ONBOARDING_STATE_COMPLETE,
	ONBOARDING_STATE_NO_ACCOUNT,
	ONBOARDING_STATE_PENDING_VERIFICATION,
} from '../../datastore/constants';
import SetupCreatePublication from './SetupCreatePublication';
import SetupCustomize from './SetupCustomize';
import SetupHeader from './SetupHeader';
import SetupPublicationActionRequired from './SetupPublicationActionRequired';
import SetupPublicationActive from './SetupPublicationActive';
import SetupPublicationPendingVerification from './SetupPublicationPendingVerification';
const { useDispatch, useSelect } = Data;

export default function SetupMain( { finishSetup } ) {
	const hasErrors = useSelect( ( select ) =>
		select( MODULES_THANK_WITH_GOOGLE ).hasErrors()
	);
	const publicationID = useSelect( ( select ) =>
		select( MODULES_THANK_WITH_GOOGLE ).getPublicationID()
	);
	const currentPublication = useSelect( ( select ) =>
		select( MODULES_THANK_WITH_GOOGLE ).getCurrentPublication()
	);

	const { resetPublications } = useDispatch( MODULES_THANK_WITH_GOOGLE );

	const reset = useCallback( () => {
		// Reset if the publication ID hasn't been set yet.
		if ( ! publicationID ) {
			resetPublications();
		}
	}, [ publicationID, resetPublications ] );

	// Reset all fetched data when user re-focuses window.
	useRefocus( reset, 15000 );

	const viewContext = useViewContext();

	useEffect( () => {
		// Don't track an event if the current publication is still loading.
		if ( currentPublication === undefined ) {
			return;
		}

		trackEvent(
			`${ viewContext }_thank-with-google`,
			'receive_publication_state',
			currentPublication === null
				? ONBOARDING_STATE_NO_ACCOUNT
				: currentPublication.onboardingState
		);
	}, [ currentPublication, viewContext ] );

	let viewComponent;

	if ( hasErrors ) {
		viewComponent = (
			<Fragment>
				<SetupHeader />
				<StoreErrorNotices
					moduleSlug="thank-with-google"
					storeName={ MODULES_THANK_WITH_GOOGLE }
				/>
			</Fragment>
		);
	} else if ( currentPublication === undefined ) {
		viewComponent = (
			<Fragment>
				<SetupHeader />
				<ProgressBar height={ 210 } />
			</Fragment>
		);
	} else if ( currentPublication === null ) {
		viewComponent = <SetupCreatePublication />;
	} else if (
		currentPublication.onboardingState === ONBOARDING_STATE_ACTION_REQUIRED
	) {
		viewComponent = <SetupPublicationActionRequired />;
	} else if (
		currentPublication.onboardingState ===
		ONBOARDING_STATE_PENDING_VERIFICATION
	) {
		viewComponent = <SetupPublicationPendingVerification />;
	} else if (
		currentPublication.onboardingState === ONBOARDING_STATE_COMPLETE &&
		! publicationID
	) {
		viewComponent = (
			<SetupPublicationActive
				// eslint-disable-next-line sitekit/acronym-case
				currentPublicationID={ currentPublication.publicationId }
			/>
		);
	} else if (
		currentPublication.onboardingState === ONBOARDING_STATE_COMPLETE &&
		publicationID
	) {
		viewComponent = <SetupCustomize finishSetup={ finishSetup } />;
	}

	return (
		<div className="googlesitekit-setup-module googlesitekit-setup-module--thank-with-google">
			{ viewComponent }
		</div>
	);
}

SetupMain.propTypes = {
	finishSetup: PropTypes.func,
};
