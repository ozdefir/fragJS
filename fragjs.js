
/**
 *
 * Converts given text into a multilevel (paragraph, sentence, word) fragmented XHTML document.
 *
 * @param  {String} text        Text string to be fragmented and converted to XHTML
 * @return {String}             Source string of the fragmented XHTML document.
 */

function fragJS(text) {

	text = text.trim();
	if (!text) throw "No text";
	
	// normalize newlines
	text = text.replace(/\r\n/g, "\n");
	text = text.replace(/\r/g, "\n");

	
	/* Create an iframe for DOM manipulations */
	fragJSFrame = document.createElement('iframe');
	document.body.appendChild(fragJSFrame);
	fragJSFrameWindow = (fragJSFrame.contentWindow) ? fragJSFrame.contentWindow : (fragJSFrame.contentDocument.document) ? fragJSFrame.contentDocument.document : fragJSFrame.contentDocument;
	fragJSFrameWindow.document.open();
	fragJSFrameWindow.document.write(text);
	fragJSFrameWindow.document.close();
	fragJSFrameHead = fragJSFrameWindow.document.head;
	fragJSFrameBody = fragJSFrameWindow.document.body;

	
	splitToParagraphs();
	splitParagraphsToSentences();
	splitSentencesToWords();

	
	var bodyMarkup = fragJSFrameBody.innerHTML;
	document.body.removeChild(fragJSFrame);
	var xhtml = generateXHTML(bodyMarkup);
	return xhtml;
	

	
	/* Paragraph Level Fragmentation */
	function splitToParagraphs() {
		htmlText = text.replace(/(.)\n(.)/g, "$1<br />$2"); // single newlines to breaks
		htmlText = htmlText.replace(/^(.+)\n?/mg, "<p>$1</p>"); // multiple newlines to paragraphs
		htmlText = htmlText.replace(/^$/mg, "<br />"); // empty lines to breaks
		htmlText = htmlText.replace(/<p>/g, "<p>´´``pBegins´´``");
		htmlText = htmlText.replace(/<\/p>/g, "´´``pEnds´´``</p>");
		htmlText = htmlText.replace(/<br \/>/g, "´´``pEnds´´``<br />´´``pBegins´´``");
		htmlText = htmlText.replace(/´´``pBegins´´``(\s*)´´``pEnds´´``/gi, '$1'); // remove unnecessary spans
		htmlText = htmlText.replace(/´´``pBegins´´``(\s*)/gi, '$1<tempspanp class="fragjs-p">');
		htmlText = htmlText.replace(/(\s*)´´``pEnds´´``/gi, '<\/tempspanp>$1');
		fragJSFrameBody.innerHTML = htmlText;
		removeEmptyFragments("p");
		enumerateFragments("p");
	}

	/* Sentence Level Fragmentation */
	function splitParagraphsToSentences() {
		allParagraphSpans = fragJSFrameBody.getElementsByClassName("fragjs-p");
		var allParagraphsArray = [];
		for (i=0; i<allParagraphSpans.length; i++) {
			allParagraphsArray.push(allParagraphSpans[i]);
		}	
		for (i=0; i<allParagraphsArray.length; i++) {
		
			var paragraphText = allParagraphsArray[i].textContent;

			// first some corrections
			paragraphText = paragraphText.replace(/(\s)([^\s])/g, capitalCheck); // rule out lower case letters as beginnings 
			paragraphText = paragraphText.replace(/,\s/g, ',´´``ws´´``'); // rule out commas as ends 
			paragraphText = paragraphText.replace(/\s([\.!?])/g, '´´``ws´´``$1'); // rule out spaces before punctuation  
			paragraphText = paragraphText.replace(/\b(([^0-9])\.\s)(([^0-9])\.\s*)+[\s\b]/g, fixInitials); // fix name initials  
			paragraphText = paragraphText.replace(/(Mr|Dr|Ms|Mrs|St|Sr|Rev)\.\s/g, '$1.´´``ws´´``'); // rule out title abbr.
			paragraphText = paragraphText.replace(/No\.\s([0-9])/g, 'No.´´``ws´´``$1'); // rule out "No."
			
			// now split
			paragraphText = paragraphText.replace(/([\.!?]["'”’»\]\)]?)(\s+)/g, '$1´´``sEnds´´``$2´´``sBegins´´``'); 
			paragraphText = paragraphText.replace(/([\.!?])—(.)/g, emDashCapitalCheck); // split sentences that are followed by em-dash instead of space

			// beginnings and ends
			paragraphText = paragraphText.replace(/^([^]+)$/g, "´´``sBegins´´``$1´´``sEnds´´``");
			
			allParagraphsArray[i].textContent = paragraphText;
		}
		htmlText = fragJSFrameBody.innerHTML;
		htmlText = htmlText.replace(/´´``sEnds´´``(\s*)´´``sBegins´´``([,;.!?'"\- ]+)´´``sEnds´´``/g, "$2´´``sEnds´´``$1");
		htmlText = htmlText.replace(/´´``sBegins´´``(\s*)´´``sEnds´´``/g, '$1'); // remove whitespace-only spans
		htmlText = htmlText.replace(/´´``sBegins´´``(\s*)/g, '$1<tempspans class="fragjs-s">');
		htmlText = htmlText.replace(/´´``ws´´``/g, ' ');
		
		fragJSFrameBody.innerHTML = htmlText.replace(/(\s*)´´``sEnds´´``/gi, '<\/tempspans>$1');	
		htmlText = fragJSFrameBody.innerHTML; //this step is necessary for auto-corrections by the browser
		fragJSFrameBody.innerHTML = htmlText;
		removeEmptyFragments("s");
		enumerateFragments("s");
	}

	
	function splitSentencesToWords() {

		allSentenceSpans = fragJSFrameBody.getElementsByClassName("fragjs-s");
		var allSentencesArray = [];
		for (i=0; i<allSentenceSpans.length; i++) {
			allSentencesArray.push(allSentenceSpans[i]);
		}
		
		for (i=0; i<allSentencesArray.length; i++) {

			sentenceText = allSentencesArray[i].textContent;
			
			// first some corrections
			sentenceText = sentenceText.replace(/\s([\.!?])/g, '´´``ws´´``$1'); // rule out spaces before punctuation  
			// now split
			sentenceText = sentenceText.replace(/(\s)/g, '´´``wEnds´´``$1´´``wBegins´´``'); // divide
			sentenceText = sentenceText.replace(/([^\s])([—])([^\s])/g, '$1´´``wEnds´´``$2´´``wBegins´´``$3');  // divide at em dash
				
			// beginnings and ends
			sentenceText = sentenceText.replace(/^([^]+)$/g, "´´``wBegins´´``$1´´``wEnds´´``");			
				
			allSentencesArray[i].textContent = sentenceText;

		}
		

		htmlText = fragJSFrameBody.innerHTML;
		htmlText = htmlText.replace(/´´``ws´´``/g, ' ');	
		htmlText = htmlText.replace(/´´``wBegins´´``([,;:.!?'"“”‘’«»*\-—\(\)\[\]\}\{\s]*)/g, '$1<tempspanw class="fragjs-w">');
		htmlText = htmlText.replace(/([,;:.!?'"“”‘’«»*\-—\(\)\[\]\}\{\s]*)´´``wEnds´´``/g, '<\/tempspanw>$1');
		htmlText = htmlText.replace(/(&(#[0-9]+|[a-z]+))<\/tempspanw>;/gi, '$1;<\/tempspanw>'); // fix for html entities

		htmlText = htmlText.replace(/<tempspanw class="fragjs-w"><\/tempspanw>/gi, '');

		fragJSFrameBody.innerHTML = htmlText
		htmlText = fragJSFrameBody.innerHTML; //this conversion is necessary for auto-corrections by the browser
		fragJSFrameBody.innerHTML = htmlText;
		removeEmptyFragments("w");
		enumerateFragments("w");		
	}


	function capitalCheck(match, p1, p2){
		if(p2 !== p2.toUpperCase()){
			return '´´``ws´´``' + p2;
		}
		else return match;
	}		
	function abbrCheck(match, p1, p2, p3, p4, p5){
		if(p1.toUpperCase() === p1.toLowerCase() && p2 !== p2.toLowerCase() && p4 !== p4.toLowerCase() && p5 !== p5.toUpperCase()){
			return p1 + p2 + ".´´``sEnds´´`` ´´``sBegins´´``" + p3 + p4 +p5;
		}
		else{
			return match;
		}

	}

	function fixInitials(match, p1, p2, p3, p4){
		if(p2.toLowerCase() !== p2 && p4.toLowerCase() !== p4){
			return match.replace(/\s/g, "´´``ws´´``");
		}
		else return match;
	}
	function emDashCapitalCheck(match, p1, p2){
		if(p2 !== p2.toLowerCase()){
			return p1 + '´´``sEnds´´``—´´``sBegins´´``' + p2;
		}
		else return match;
	}


	
	
   /* Generate fragJS XHTML output */
    function generateXHTML(text) {
		text = text.replace(/&nbsp;/gi, ' '); // normalize nbsp
		text = text.replace(/tempspanp/g, 'span');
		text = text.replace(/tempspans/g, 'span');
		text = text.replace(/tempspanw/g, 'span');
		text = text.replace(/<br>(\s*<br>)+/g, '<br /><br />');  // replace multiple breaks with two breaks
		text = text.replace(/<div><\/div>(\s*<div><\/div>)*/g, '<hr style="visibility: hidden; margin: 0; border-width: 0; padding: 0" />');  // replace multiple empty divs with hr
        text = text.replace(/<br>/g, '<br />');  // proper break tag for XHTML is "<br />"
        text = text.replace(/^$/g, '');  // remove blank lines
		text = text.replace(/(<p>(<br \/>\n)+<\/p>\n){2,}/gi, ''); // having too many breaks is pointless. espceially targets image 'div's of gutenberg books & excludes intentional ones.
        var xhtml = '<?xml version="1.0" encoding="UTF-8"?>\n';
        xhtml += '<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops" lang="en" xml:lang="en">\n\n';
        xhtml += '<head>\n<meta charset="utf-8"/>\n<meta name="generator" content="fragjs 1.0"/>\n';
        xhtml += '<meta name="originator" content="' + ("Plain Text") + '"/>\n';
        xhtml += '<meta name="viewport" content="width=device-width,height=1024"/>\n';
        xhtml += '<title>fragjs output</title>\n';
		xhtml += "<style>\n"
		xhtml += "  html                    {color: #333; font-size: 18px; font-family: Georgia, 'Times New Roman', Times, serif;\n"
		xhtml += "                          line-height: 1.7; text-align: justify;}\n";
		xhtml += "  body                    { margin: 2em; margin-top:60px; margin-top:8vh;}\n";
		xhtml += "  h1, h2, h3, h4, h5, h6  { text-align:center; clear:both; }\n"
		xhtml += "  pre                     { white-space: pre-wrap; }"
		xhtml += "</style>\n";
		xhtml += '</head>\n\n';
        xhtml += '<body>\n' + text + '\n</body>\n\n';
        xhtml += '</html>\n';
        return xhtml;
    }



	function removeEmptyFragments(granularity){
		var className = "fragjs-" + granularity;
		allFragments = fragJSFrameBody.getElementsByClassName(className);
		for (i=allFragments.length-1; i>=0; i--) {
			if (!allFragments[i].innerText) {
				allFragments[i].outerHTML = allFragments[i].innerHTML;
			}
		}
	}


	function enumerateFragments(granularity){
		var className = "fragjs-" + granularity;
		allFragments = fragJSFrameBody.getElementsByClassName(className);
		for (i=allFragments.length-1; i>=0; i--) {
			if(!allFragments[i].innerText.replace(/^[,;:.!?'"“”‘’«»*\-–—\(\)\[\]\}\{\s]+$/,"")) {
				allFragments[i].outerHTML = allFragments[i].innerHTML;
			}
		}
		allFragments = fragJSFrameBody.getElementsByClassName(className);
		for (i=allFragments.length-1; i>=0; i--) {
			allFragments[i].id = granularity + ("00000" + (i + 1)).slice(-6);
		}
	}

}
