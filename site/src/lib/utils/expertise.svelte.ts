import type { Expertise } from '$lib/db/expertise.repo';

export function groupExpertise(expertise: Expertise[] | null) {
	if (expertise == null) return [];

	const groups: ExpertiseGroupWithValue[] = [];

	expertise.forEach((entry) => {
		let sortedGroup = groups.find(({ id }) => id === entry.groupId);
		if (sortedGroup == null) {
			sortedGroup = new ExpertiseGroupWithValue({ id: entry.groupId, name: entry.groupName });
			groups.push(sortedGroup);
		}
		sortedGroup.expertise.push({ ...entry, value: 0 });
	});

	return groups;
}

class ExpertiseGroupWithValue {
	public id: number;
	public name: string;

	private _expertise: (Expertise & { value: number })[] = $state([]);
	public get expertise() {
		return this._expertise;
	}
	public set expertise(expertise: (Expertise & { value: number })[]) {
		this._expertise = expertise;
	}

	private _average: number = $derived.by(() => {
		if (this._expertise.length === 0) return 0;
		const sum = this._expertise.reduce((total, entry) => total + entry.value, 0);
		return sum / this._expertise.length;
	});
	public get average() {
		return this._average;
	}

	constructor({ id, name }: { id: number; name: string }) {
		this.id = id;
		this.name = name;
	}

	public setValueOfExpertise({ id: expertiseId, value }: { id: number; value: number }) {
		const expertiseIndex = this._expertise.findIndex(({ id }) => id === expertiseId);
		if (expertiseIndex < 0) return;
		this._expertise[expertiseIndex].value = value;
	}
}
