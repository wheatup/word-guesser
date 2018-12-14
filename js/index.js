let $input, $pseudo, $wordsArea, $dictionaries, $tips;
let timer;
let dictionaries = [];
const maxCount = 1000;

String.prototype.replaceAll = function (search, replacement) {
	var target = this;
	return target.split(search).join(replacement);
};

$(document).ready(async () => {
	$input = $('#input');
	$wordsArea = $('.words');
	$pseudo = $('#pseudo');
	$dictionaries = $('.dictionaries');
	$tips = $('.tips');
	$('.dictionaries').on('change', '.dictionary-option', onDictionaryChange);

	let dictionary = await loadDictionary();
	createDictionaryOption(dictionary, 'Default Dictionary', true);

	$input.attr('contenteditable', true);
	onReceiveInput();
	$input.on('input', onTextChange);
});

function onTextChange(){
	let text = $input.html();
	onReceiveInput(text);
}

function onReceiveInput(text) {
	if (!text) {
		$pseudo.html('Enter Text');
		$pseudo.addClass('empty');
		onFoundWords();
		return;
	} else {
		$pseudo.removeClass('empty');
	}

	let displayString = text;
	displayString = displayString.replace(/[\.\*\?]/g, '_');
	$pseudo.html(displayString);


	let regexString = text;
	regexString = regexString.replace(/[\.\*\?]/g, '_');
	regexString = regexString.replaceAll('_', '\\w');
	regexString = regexString.replaceAll(' ', '\\s');
	regexString = regexString.replaceAll('&nbsp;', '\\s');
	const regex = new RegExp(`^${regexString}$`, 'i');
	const wordSet = [];
	dictionaries.forEach(dict => {
		if (dict.selected) {
			const words = dict.dictionary.filter(word => regex.test(word));
			wordSet.push(words);
		}
	});
	onFoundWords(wordSet);
}

function onFoundWords(wordSet) {
	$wordsArea.html('');
	$tips.html('');
	if (timer) {
		clearTimeout(timer);
	}
	if (!wordSet || wordSet.length === 0) {
		$tips.html(`<span>Displaying 0 of 0 results</span>`);
		return;
	}

	timer = setTimeout(() => {
		let totalCount = 0, count = 0;

		for (let words of wordSet) {
			totalCount += words.length;
		}

		outer: for (let words of wordSet) {
			for (let word of words) {
				$wordsArea.append(`<span>${word}</span>`)
				count++;
				if (count >= maxCount) {
					break outer;
				}
			}
		}
		$tips.html(`<span>Displaying ${count} of ${totalCount} results</span>`);
	}, 500);
}

function loadDictionary() {
	return new Promise((resolve, reject) => {
		$.getJSON('/data/dictionary.json').then(json => {
			resolve(json);
		}).catch(ex => {
			reject(ex);
		});
	});
}

function onDictionaryChange(e) {
	const dict = dictionaries.find(d => d.name === e.target.dataset.dictionary);
	dict.selected = e.target.checked;
	console.log(dict);
	onTextChange();
}

function createDictionaryOption(dict, name, selected) {
	let d = { selected, dictionary: dict, name };
	dictionaries.push(d);
	$dictionaries.html('');
	dictionaries.forEach(d => {
		$dictionaries.append(`
			<div class="dictionary">
				<input data-dictionary="${name}" id="dictionary_${name}" class="dictionary-option" type="checkbox" ${d.selected && 'checked="checked"'} />
				<label for="dictionary_${name}" data-count="${dict.length}">${name}</label>
			</div>
		`);
	});
}