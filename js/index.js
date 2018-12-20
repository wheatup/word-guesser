let $input, $pseudo, $wordsArea, $dictionaries, $tips, $userInput;
let timer;
let dictionaries = [];
let searchedWords = [];
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
	$userInput = $('#user_input');
	$('.dictionaries').on('change', '.dictionary--option', onDictionaryChange);
	$('.words').on('click', 'span', onClickWord);
	$('#add_words').on('click', onClickAddWords);
	$('#clear_words').on('click', onClickClearWords);
	$('.how-to-use').on('click', () => {
		swal('How To Use', `
			Type letters in the search box, type <span style="color: red;">_</span> <span style="color: red;">.</span> <span style="color: red;">?</span> or <span style="color: red;">*</span> as wildcards to search words. 
			<br><br>You can add custom word by typing word in the box below the search box, then click "Add words". 
			<br><br>For adding multiple custom words, use comma to separate them.`, 'info');
	});
	$('.inputs--clear').on('click', () => {
		$input.html('');
		onTextChange();
	});
	$input.attr('contenteditable', true);
	$input.on('input', onTextChange);

	let dictionary = await loadDictionary();
	setUserDictionary();
	createDictionaryOption(dictionary, 'Default Dictionary', true);

	onReceiveInput();
});

function onTextChange() {
	let text = $input.html();
	onReceiveInput(text);
}

function onReceiveInput(text) {
	if (!text) {
		$pseudo.html('Search');
		$pseudo.addClass('empty');
		onFoundWords();
		return;
	} else {
		$pseudo.removeClass('empty');
	}
	$tips.html('Searching...');

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
	searchedWords = [];
	if (timer) {
		clearTimeout(timer);
	}
	if (!wordSet || wordSet.length === 0) {
		$tips.html(`Displaying 0 of 0 results`);
		return;
	}

	timer = setTimeout(() => {
		let totalCount = 0, count = 0;

		for (let words of wordSet) {
			totalCount += words.length;
		}

		outer: for (let words of wordSet) {
			for (let word of words) {
				if (searchedWords.indexOf(word < 0)) {
					searchedWords.push(word);
				}
				count++;
				if (count >= maxCount) {
					break outer;
				}
			}
		}

		showSearchedWords();
		$tips.html(`Displaying ${count.toLocaleString('en-US')} of ${totalCount.toLocaleString('en-US')} results`);
	}, 500);
}

function showSearchedWords() {
	searchedWords.forEach(word => $wordsArea.append(`<span>${word}</span>`));
}

function loadDictionary() {
	return new Promise((resolve, reject) => {
		$.getJSON('./data/dictionary.json').then(json => {
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

function setUserDictionary() {
	let words = [];
	const udStr = localStorage.getItem('user_dictionary');
	if (udStr) {
		const uWords = udStr.split(',');
		uWords.map(w => words.push(w.trim()));
	}
	createDictionaryOption(words, 'User Dictionary');
}

function onClickWord(e) {
	const { target } = e;
}

function createDictionaryOption(words, name, selected = true) {
	let d = { selected, dictionary: words, name };
	dictionaries.push(d);
	refreshDictionary();
}

function refreshDictionary() {
	$dictionaries.html('');
	dictionaries.forEach(d => {
		$dictionaries.append(`
			<div class="dictionary">
				<input class="dictionary--option" data-dictionary="${d.name}" id="dictionary_${d.name}" type="checkbox" ${d.selected && 'checked="checked"'} />
				<label class="dictionary--label" for="dictionary_${d.name}" data-count="${d.dictionary.length.toLocaleString('en-US')}">${d.name}</label>
			</div>
		`);
	});
}

function onClickAddWords() {
	const text = $userInput.val();
	if (text) {
		const rawList = text.split(',');
		const d = dictionaries.find(d => d.name === 'User Dictionary');
		if (d) {
			const foundWords = [];
			rawList.forEach(word => {
				let w = word.trim();
				let found = false;
				for(let wordInDictionary of d.dictionary){
					if(wordInDictionary.toUpperCase() === w.toUpperCase()){
						found = true;
						break;
					}
				}
				if(!found){
					d.dictionary.push(w);
				}else{
					foundWords.push(w);
				}
			});
			refreshDictionary();
			saveUserDictionary();
			$userInput.val('');
			if(foundWords.length > 0){
				swal('Already Exist', `Words "${foundWords.join(", ")}" ${foundWords.length > 1 ? "are" : "is"} already in the dictionary`, 'warning');
			}
		}
	}
}

function onClickClearWords() {
	Swal({
		title: 'Are you sure?',
		text: "You are about to clear the user dictionary.",
		type: 'warning',
		showCancelButton: true,
		confirmButtonColor: '#3085d6',
		cancelButtonColor: '#d33',
		confirmButtonText: 'Yes, remove all the words.'
	}).then((result) => {
		if (result.value) {
			const d = dictionaries.find(d => d.name === 'User Dictionary');
			if (d) {
				d.dictionary = [];
				refreshDictionary();
				saveUserDictionary();
			}
			Swal(
				'Deleted!',
				'Your custom dictionary has been cleard.',
				'success'
			)
		}
	})
}

function saveUserDictionary() {
	const d = dictionaries.find(d => d.name === 'User Dictionary');
	if (d) {
		const text = d.dictionary.join(',');
		localStorage.setItem('user_dictionary', text);
	}
}