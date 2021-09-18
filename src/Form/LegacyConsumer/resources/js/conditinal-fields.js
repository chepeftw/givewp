document.addEventListener('readystatechange', event => {
	if (event.target.readyState !== 'complete') {
		return null;
	}

	const state = {};

	/**
	 * Get list of watched fields.
	 * @unreleased
	 *
	 * @return object
	 */
	function getWatchedElementNames(donationForm) {
		const fields = {};

		donationForm.querySelectorAll('[data-field-visibility-conditions]').forEach(function (inputField) {
			const visibilityConditions = JSON.parse(inputField.getAttribute('data-field-visibility-conditions'));
			const visibilityCondition = visibilityConditions[0]; // Currently we support only one visibility condition.
			const {field} = visibilityCondition;

			fields[field] = {
				...fields[field],
				[inputField.name]: visibilityConditions
			}
		})

		return fields;
	}

	/**
	 * @unreleased
	 *
	 * @param operator
	 * @param firstData
	 * @param secondData
	 *
	 * @return boolean
	 */
	function compareWithOperator( operator, firstData, secondData ){
		return {
			'=': firstData === secondData,
			'!=': firstData != secondData,
			'>': firstData > secondData,
			'>=': firstData >= secondData,
			'<': firstData < secondData,
			'<=': firstData <=secondData
		}[operator]
	}

	/**
	 * Handle fields visibility.
	 * @unreleased
	 */
	function handleVisibility(donationForm, visibilityConditionsForWatchedField) {
		for (const [inputFieldName, visibilityConditions] of Object.entries(visibilityConditionsForWatchedField)) {
			const inputField = donationForm.querySelector(`[name="${inputFieldName}"]`);
			const fieldWrapper = inputField.closest('.form-row');
			const visibilityCondition = visibilityConditions[0]; // Currently we support only one visibility condition.
			let visible = false;
			const {field, operator, value} = visibilityCondition;

			const inputs = donationForm.querySelectorAll(`[name="${field}"]`);
			let hasFieldController = !!inputs.length;

			if (hasFieldController) {
				inputs.forEach((input) => {
					const fieldType = input.getAttribute('type');
					const comparisonResult = compareWithOperator(operator, input.value, value);

					if (fieldType && (fieldType === 'radio' || fieldType === 'checkbox')) {
						if (input.checked && comparisonResult) {
							visible = true;
						}
					} else if (comparisonResult) {
						visible = true;
					}
				});

				// Show or Hide field wrapper.
				visible ?
					fieldWrapper.classList.remove('give-hidden') :
					fieldWrapper.classList.add('give-hidden');
			}
		}
	}

	/**
	 * Setup state for condition visibility settings.
	 * state contains list of watched elements per donation form.
	 *
	 * @unreleased
	 */
	function addVisibilityConditionsToStateForDonationForm(donationForm) {
		const uniqueDonationFormId = donationForm.getAttribute('data-id');
		const watchedFields = getWatchedElementNames(donationForm);

		// Add donation form to state only if visibility conditions exiting for at least form field.
		if (uniqueDonationFormId && Object.keys(watchedFields).length) {
			state[uniqueDonationFormId] = watchedFields;
		}
	}

	/**
	 * Setup state for condition visibility settings.
	 * state contains list of watched elements per donation form.
	 *
	 * @unreleased
	 */
	async function addVisibilityConditionsToStateForAllDonationForm() {
		await document.querySelectorAll('form.give-form').forEach(addVisibilityConditionsToStateForDonationForm);
	}

	/**
	 * @unreleased
	 */
	function applyVisibilityConditionsAttachedToWatchedField(donationForm, fieldName) {
		const uniqueDonationFormId = donationForm.getAttribute('data-id');

		if (
			donationForm &&
			uniqueDonationFormId &&
			(uniqueDonationFormId in state)
		) {
			const formState = state[uniqueDonationFormId];

			if (fieldName in formState) {
				handleVisibility(donationForm, formState[fieldName])
			}
		}
	}

	/**
	 * @unreleased
	 * @param donationForm
	 */
	function applyVisibilityConditionsToDonationForm(donationForm) {
		const uniqueDonationFormId = donationForm.getAttribute('data-id');

		if (uniqueDonationFormId && (uniqueDonationFormId in state)) {
			const formState = state[uniqueDonationFormId];

			for (const [watchedFieldName, visibilityConditions] of Object.entries(formState)) {
				handleVisibility(
					document.querySelector(`form[data-id="${uniqueDonationFormId}"]`)
						.closest('.give-form'),
					visibilityConditions
				);
			}
		}
	}

	/**
	 * @unreleased
	 */
	function applyVisibilityConditionsToAllDonationForm() {
		for (const [uniqueDonationFormId, donationFormState] of Object.entries(state)) {
			for (const [watchedFieldName, visibilityConditions] of Object.entries(donationFormState)) {
				handleVisibility(
					document.querySelector(`form[data-id="${uniqueDonationFormId}"]`)
						.closest('.give-form'),
					visibilityConditions
				);
			}
		}
	}

	addVisibilityConditionsToStateForAllDonationForm()
		.then(
			r => {
				applyVisibilityConditionsToAllDonationForm();

				// Apply visibility conditions to donation form when donor switch gateway.
				document.addEventListener(
					'give_gateway_loaded',
					event => {
						const donationForm = document.getElementById(event.detail.formIdAttribute);
						addVisibilityConditionsToStateForDonationForm(donationForm);
						applyVisibilityConditionsToDonationForm(donationForm);
					}
				);


				// Look for change in watched elements.
				document.addEventListener(
					'change',
					event => applyVisibilityConditionsAttachedToWatchedField(
						event.target.closest('form.give-form'),
						event.target.getAttribute('name')
					)
				);
			});
});
