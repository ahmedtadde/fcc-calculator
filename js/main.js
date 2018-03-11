'use strict';

const tabs = {
  'main-section' : document.getElementById('main-section'),
  'history-section' : document.getElementById('history-section'),
  'default-funcs' : document.getElementById('default-funcs'),
  'alt-funcs' : document.getElementById('alt-funcs')
}
const input = document.getElementById('input');
const btns = Array.from(document.getElementsByClassName('btn'));
const tabBtns = Array.from(document.getElementsByClassName('btn-tab'));
const inputBtns = Array.from(document.getElementsByClassName('btn-input'));
const commandBtns = Array.from(document.getElementsByClassName('btn-command'));
const output = document.getElementById('output');
let eval_history = document.getElementById('history_records');
let unit = 'DEG';
let memory = 0;
let answer = 0;
let cursor;

(() => {
  input.onkeyup = (e) => {
    let keycode = (e.keyCode ? e.keyCode : e.which);
    if (keycode === 13) {
      evaluate();
    }
  }

  input.onmouseup = (e) => {
    cursor = input.selectionEnd;
  }

  btns.forEach((btn) => {
    if(!tabBtns.includes(btn)){
      btn.onclick = () => {
        (() => {
          btn.classList.add('active');
          setTimeout(() => {
            btn.classList.remove('active');
          }, 250);
        })();
      }
    }
  });

  tabBtns.forEach((btn) => {
    btn.onclick = () => {
      let classes = btn.classList;
      if(classes.contains('active')){
        classes.remove('active');
      }else{
        classes.add('active');
      }
    }
  });

  inputBtns.forEach((btn) => {
    let onclick = btn.onclick;
    btn.onclick = () => {
      ((func) => {
        func();
      })(onclick);

      ((el) => {
        // output.textContent = '';
        let hasDataInput = btn.hasAttribute('data-input');
        if(cursor !== undefined){
          let str = el.value;
          let splitStr = str.split('');
          let input = hasDataInput ? btn.getAttribute('data-input') : btn.textContent;
          splitStr.splice(cursor, 0, input);
          cursor+=input.length;
          el.value = splitStr.join('');
        }else{
          el.value+= hasDataInput? btn.getAttribute('data-input') : btn.textContent;
        }
      })(input);
    }
  });

  commandBtns.forEach((btn) => {
    let onclick = btn.onclick;
    btn.onclick = () => {

      ((func) => {
        func();
      })(onclick);

      ((command) => {

        switch (command) {
          case 'switch_unit':
            switchUnit(btn);
            break;

          case 'switch_tab':
            switchTab(btn);
            break;
          case 'evaluate':
            evaluate();
            break;

          case 'input_last_answer':
            inputLastAnswer();
            break;

          case 'clear_all':
            clearDisplays();
            break;

          case 'clear_input':
            clearInput();
            break;

          case 'clear_last_input':
            clearLastInput();
            break;

          case 'get_memory':
            output.textContent = memory;
            break;

          case 'clear_memory':
            memory = 0;
            output.textContent = memory;
            break;

          case 'add_to_memory':
            memory = parseFloat(memory) + parseFloat(answer);
            output.textContent = memory;
            break;

          case 'substract_from_memory':
            memory = parseFloat(memory) - parseFloat(answer);
            output.textContent = memory;
            break;

          case 'clear_history':
            eval_history.innerHTML = '';
            break;

          default:
        }
      })(btn.getAttribute('data-command'));
    }
  });
})();

(() => {
  let replacements = {};
  // create trigonometric functions replacing the input depending on angle config
  ['sin', 'cos', 'tan', 'sec', 'cot', 'csc'].forEach(function(name) {
    let fn = math[name]; // the original function

    let fnNumber = function (x) {
      // convert from configured type of angles to radians
      switch (unit) {
        case 'DEG':
          return fn(x / 360 * 2 * Math.PI);
        case 'GRAD':
          return fn(x / 400 * 2 * Math.PI);
        default:
          return fn(x);
      }
    };

    // create a typed-function which check the input types
    replacements[name] = math.typed(name, {
      'number': fnNumber,
      'Array | Matrix': function (x) {
        return math.map(x, fnNumber);
      }
    });
  });

  // create trigonometric functions replacing the output depending on angle config
  ['asin', 'acos', 'atan', 'atan2', 'acot', 'acsc', 'asec'].forEach(function(name) {
    let fn = math[name]; // the original function

    let fnNumber = function (x) {
      let result = fn(x);

      if (typeof result === 'number') {
        // convert to radians to configured type of angles
        switch(unit) {
          case 'DEG':  return result / 2 / Math.PI * 360;
          case 'GRAD': return result / 2 / Math.PI * 400;
          default: return result;
        }
      }

      return result;
    };

    // create a typed-function which check the input types
    replacements[name] = math.typed(name, {
      'number': fnNumber,
      'Array | Matrix': function (x) {
        return math.map(x, fnNumber);
      }
    });
  });

  // import all replacements into math.js, override existing trigonometric functions
  math.import(replacements, {override: true});

})();

function switchTab(el){
  let active = el.getAttribute('data-tab-active');
  let hidden = el.getAttribute('data-tab-hidden');

  tabs[active].classList.add('hidden');
  tabs[hidden].classList.remove('hidden');

  el.setAttribute('data-tab-active', hidden);
  el.setAttribute('data-tab-hidden', active);
}

function evaluate(){
  try {
      let result;
      output.innerHTML = '';
      // parse the expression
      result = math.parse(input.value);
      // evaluate the result of the expression
      result = math.format(result.compile().eval());

      //display result
      answer = result.toString().replace(/\[|\]/g,'');
      output.textContent = answer;

      let record =  document.createElement('div');
      record.setAttribute('class', 'history_record');

      let recordBtn = document.createElement('span');
      recordBtn.setAttribute('class', 'btn');
      recordBtn.innerHTML = '<i class="fa fa-times-circle"></i> Clear';
      recordBtn.onclick = () => {
        recordBtn.parentElement.remove();
      }

      let recordContent = document.createElement('span');
      recordContent.setAttribute('class', 'btn');
      recordContent.textContent = input.value + ' = ' + answer;
      recordContent.style.textAlign = 'right';
      recordContent.onclick = () => {
        let record = '('+recordContent.textContent.split(" = ")[0]+')';
        if(cursor !== undefined){
          let str = input.value;
          let splitStr = str.split('');
          splitStr.splice(cursor, 0, record);
          cursor+=record.length;
          input.value  = splitStr.join('');
        }else{
          input.value += record;
        }
      }

      record.appendChild(recordBtn);
      record.appendChild(recordContent);

      eval_history.appendChild(record);

    }

    catch (err) {
      output.innerHTML = '<span style="color: red; font-size: .75em">' + err.toString() + '</span>';
    }
}

function inputLastAnswer(){
  if(cursor !== undefined){
    let str = input.value;
    let splitStr = str.split('');
    splitStr.splice(cursor, 0, answer);
    cursor+=answer.length;
    input.value  = splitStr.join('');
  }else{
    input.value += answer;
  }

  // output.textContent = answer;
}

function clearDisplays(){
  input.value = '';
  output.textContent = '';
}

function clearInput(){
  input.value = '';
}

function clearLastInput(){
  let str = input.value;
  let splitStr = str.split('');
  splitStr.pop();
  input.value = splitStr.join('');
}

function switchUnit(el){
  let current = el.textContent;
  let alternatives = el.getAttribute('data-alt').split("|");
  el.textContent = alternatives.shift();

  alternatives.push(current);
  el.setAttribute('data-alt', alternatives.join("|"));
  unit = el.textContent;
}
