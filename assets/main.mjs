import presets from '/assets/presets.json' with { type: 'json' };
import config from '/assets/config.json' with { type: 'json' };
import Game from '/assets/game.mjs';


Math.precisionRound = (number, precision = 1) => {
    return Math.round(number * Math.pow(10, precision))/Math.pow(10, precision);
}

const tabs = document.querySelectorAll('div.tab');
document.querySelectorAll('button[data-tab]').forEach(btn => {
    btn.onclick = e => { tabs.forEach(tab => { tab.classList.toggle('show', tab.id === btn.dataset.tab) }) }
})

document.forms.custom.querySelectorAll('input[name]').forEach(input => {
    input.min = config[input.name].min;
    input.max = config[input.name].max;
    input.value = Number(config[input.name].min);
})

document.querySelectorAll('.scale--wrapper').forEach(wrapper => {
    let scale = wrapper.querySelector('.scale'),
        cover = wrapper.querySelector('.scale--covered'),
        slider = wrapper.querySelector('.slider'),
        counter = wrapper.querySelector('.counter'),
        input = wrapper.querySelector('input');

    let initialX, newX; 

    document.onmousedown = e => {

        if (e.target == slider) {
            initialX = e.clientX - slider.offsetLeft;
            e.preventDefault();

            document.onmousemove = me => { 
                newX = me.clientX - initialX;

                if (newX < 0) newX = 0;
                else if (newX > scale.offsetWidth - slider.offsetWidth) newX = scale.offsetWidth - slider.offsetWidth;

                const k = Math.precisionRound(newX / (scale.offsetWidth - slider.offsetWidth), 2);
                input.value = Math.precisionRound(k * (Number(input.max) - Number(input.min)) + Number(input.min),2);

                restyleSlider(slider, counter, cover, k, newX);
            }

            document.onmouseup = () => { 
                document.onmousemove = null;
                document.onmouseup = null;
            }

            counter.innerText = `${Number(input.min) * 100}%`;
        }
        
    }
})

function restyleSlider(slider, counter, cover, k, newX = null) {
    console.log(k);
    let input = counter.nextElementSibling;
    if (newX === null) newX = (slider.parentNode.offsetWidth * k) - slider.offsetWidth;

    slider.style.left = `${Math.floor(newX)}px`;
    slider.parentNode.parentNode.classList.toggle('too-hard', k > 0.8)
                
    counter.innerText = `${Math.floor(Number(input.value) * 100)}%`
    counter.style.color = `#${Math.floor(k*255).toString(16).padStart('0',2)}0000`;
    counter.style.scale = 1 + Math.precisionRound(k * 0.5, 2);

    cover.style.width = `${Math.floor(newX)}px`;
    cover.style.backgroundColor = `#b30606${Math.floor(k*123).toString(16).padStart('0',2)}`;
}

document.getElementById('random').onclick = e => {
    const preset = Game.generatePreset();
    for (const [key, value] of Object.entries(preset)) {
        console.log(document.forms.custom.querySelector(`input[name="${key}"]`));
        document.forms.custom.querySelector(`input[name="${key}"]`).value = value;
    }

    const minesPercentInput = document.forms.custom.querySelector('input[name="minesPercent"]');
    let [max, min] = [Number(minesPercentInput.max), Number(minesPercentInput.min)];
    
    const k = Math.precisionRound((preset.minesPercent - min)/(max-min),2);

    let root = minesPercentInput.parentNode;
    let slider = root.querySelector('.slider'),
        counter = root.querySelector('.counter'),
        cover = root.querySelector('.scale--covered');


    restyleSlider(slider, counter, cover, k);
}

window.Game = Game;
