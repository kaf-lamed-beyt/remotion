import React, {useCallback, useMemo, useState} from 'react';
import type {z} from 'zod';
import {Checkmark} from '../../../icons/Checkmark';
import {useZodIfPossible} from '../../get-zod-if-possible';
import {Spacing} from '../../layout';
import type {ComboboxValue} from '../../NewComposition/ComboBox';
import {Combobox} from '../../NewComposition/ComboBox';
import {ValidationMessage} from '../../NewComposition/ValidationMessage';
import {narrowOption, optionRow} from '../layout';
import {SchemaLabel} from './SchemaLabel';
import type {JSONPath} from './zod-types';
import type {UpdaterFunction} from './ZodSwitch';

const container: React.CSSProperties = {
	width: '100%',
};

type LocalState = {
	value: string;
	zodValidation: z.SafeParseReturnType<unknown, unknown>;
};

export const ZodEnumEditor: React.FC<{
	schema: z.ZodTypeAny;
	jsonPath: JSONPath;
	value: string;
	defaultValue: string;
	setValue: UpdaterFunction<string>;
	onSave: UpdaterFunction<string>;
	compact: boolean;
	showSaveButton: boolean;
	onRemove: null | (() => void);
	saving: boolean;
}> = ({
	schema,
	jsonPath,
	compact,
	setValue: updateValue,
	defaultValue,
	value,
	onSave,
	showSaveButton,
	onRemove,
	saving,
}) => {
	const z = useZodIfPossible();
	if (!z) {
		throw new Error('expected zod');
	}

	const [localValue, setLocalValue] = useState<LocalState>(() => {
		return {
			value,
			zodValidation: schema.safeParse(value),
			revision: 0,
		};
	});

	const def = schema._def;

	const typeName = def.typeName as z.ZodFirstPartyTypeKind;
	if (typeName !== z.ZodFirstPartyTypeKind.ZodEnum) {
		throw new Error('expected enum');
	}

	const isRoot = jsonPath.length === 0;

	const onChange = useCallback(
		(updater: (oldV: string) => string, forceApply: boolean) => {
			setLocalValue((oldLocalState) => {
				const newValue = updater(oldLocalState.value);
				const safeParse = schema.safeParse(newValue);
				if (safeParse.success || forceApply) {
					updateValue(updater, false, forceApply);
				}

				return {
					value: newValue,
					zodValidation: safeParse,
				};
			});
		},
		[schema, updateValue]
	);

	const reset = useCallback(() => {
		onChange(() => defaultValue, true);
	}, [defaultValue, onChange]);

	const comboBoxValues = useMemo(() => {
		return def.values.map((option: string): ComboboxValue => {
			return {
				value: option,
				label: option,
				id: option,
				keyHint: null,
				leftItem: option === value ? <Checkmark /> : null,
				onClick: (id: string) => {
					onChange(() => id, false);
				},
				quickSwitcherLabel: null,
				subMenu: null,
				type: 'item',
			};
		});
	}, [def.values, onChange, value]);

	const save = useCallback(() => {
		onSave(() => value, false, false);
	}, [onSave, value]);

	return (
		<div style={compact ? narrowOption : optionRow}>
			<SchemaLabel
				onSave={save}
				showSaveButton={showSaveButton}
				isDefaultValue={value === defaultValue}
				compact={compact}
				onReset={reset}
				jsonPath={jsonPath}
				onRemove={onRemove}
				saving={saving}
			/>

			<div style={isRoot ? undefined : container}>
				<Combobox values={comboBoxValues} selectedId={value} title={value} />
			</div>
			{!localValue.zodValidation.success && (
				<>
					<Spacing x={1} />
					<ValidationMessage
						align="flex-start"
						message={localValue.zodValidation.error.format()._errors[0]}
						type="error"
					/>
				</>
			)}
		</div>
	);
};
