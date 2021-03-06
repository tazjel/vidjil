/*
 * This file is part of Vidjil <http://www.vidjil.org>,
 * High-throughput Analysis of V(D)J Immune Repertoire.
 * Copyright (C) 2013-2017 by Bonsai bioinformatics
 * at CRIStAL (UMR CNRS 9189, Université Lille) and Inria Lille
 * Contributors: 
 *     Marc Duez <marc.duez@vidjil.org>
 *     Antonin Carette <antonin.carette@etudiant.univ-lille1.fr>
 *     The Vidjil Team <contact@vidjil.org>
 * 
* "Vidjil" is free software: you can redistribute it and/or modify
* it under the terms of the GNU General Public License as published by
* the Free Software Foundation, either version 3 of the License, or
* (at your option) any later version.
*
* "Vidjil" is distributed in the hope that it will be useful,
* but WITHOUT ANY WARRANTY; without even the implied warranty of
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
* GNU General Public License for more details.
*
* You should have received a copy of the GNU General Public License
* along with "Vidjil". If not, see <http://www.gnu.org/licenses/>
*/


/**
 * Axis object contain labels and their position on an axis (from 0 to 1) <br>
 * can provide the position of a clone on it
 * @constructor
 * @param {Model} model 
 * @reverse {boolean} reverse - by default axis go from low to high but can be revsersed
 * */
function NumericalAxis (model, reverse, can_undefined) {
    this.m = model;
    this.labels = [];
    this.clones = [];
    this.value_mapping = {};
    this.reverse = reverse;
    GenericAxis.call(this, reverse, can_undefined);
}


NumericalAxis.prototype = Object.create(GenericAxis.prototype);

    /**
     * compute axis using a given function <br>
     * find min/max value possible with the given function and use them as range <br>
     * TODO make it works with non numerical value
     * @param {function} fct - must take a clone index in arg and return a numerical value
     * @param {number|function} default_min - the minimal boundary can't be over default_min 
     * @param {number|function} default_min - the maximal boundary can't be under default_max
     * @param {boolean} percent - display label as percent ( value 1 => 100%)
     * @param {boolean} use_log - use a logarithmic scale instead of a linear
     * */
    NumericalAxis.prototype.init = function(clones, fct, labels, sort, default_min, default_max, use_log, display_label){
        this.reset();
        this.clones = clones;
        use_log = typeof use_log !== 'undefined' ? use_log : false;
        display_label = typeof display_label !== 'undefined' ? display_label : true;
        var self = this;
        
        if (typeof fct === 'function') {
            this.converter = fct;
        } else {
            this.converter = function(elem) {
                return elem[fct];
            }
        }
        
        var min = default_min;
        var max = default_max;
        if (typeof min === 'function') min = min();
        if (typeof max === 'function') max = max();

        if (typeof labels == "undefined") {
            for (var i in this.clones){
                if (! this.clones[i].isVirtual()) {
                    var tmp = this.applyConverter(this.clones[i]);

                    if ( typeof tmp != "undefined" && !isNaN(tmp)){
                        if ( tmp > max || typeof max == "undefined") max = tmp;
                        if ( tmp < min || typeof min == "undefined") min = tmp;
                    }
                }
            }
            for (var j=min; j<=max; j++){
                this.value_mapping[j]=[];
            }
        } else {
            for (var k in labels) {
                var val = labels[k];
                this.value_mapping[val] = [];
            }
        }
        if(this.can_undefined)
            this.value_mapping["?"] = [];

        for(var idx in this.clones) {
            var clone = clones[idx];
            if(!clone.isVirtual()) {
                var value = this.applyConverter(clone);
                if (typeof value == "undefined" || typeof this.value_mapping[value] == "undefined" ) {
                    if (this.can_undefined)
                        this.value_mapping["?"].push(clone);
                }else{
                    this.value_mapping[value].push(clone);
                }
            }
        }

        if (typeof min == "undefined"){
            min = 0;
            max = 1;
        }
        else {
            min = nice_floor(min)
            max = nice_ceil(max)
        }

        if (this.can_undefined && ! use_log) {
            max = max + (max - min)/this.NB_STEPS_IN_AXIS
        }

        this.min = min;
        this.max = max;

        var range = [0,1]
        if (self.reverse) range = [1,0]
        if (use_log){
            this.sizeScale = d3.scale.log()
            .domain([min, max])
            .range(range);
        }else{
            this.sizeScale = d3.scale.linear()
                .domain([min, max])
                .range(range);
        }
            
        this.computeLabels(min, max, use_log, display_label, this.can_undefined)
    }

    NumericalAxis.prototype.pos = function(clone) {
        var value, pos;
        value = this.applyConverter(clone);

        if (typeof value != "undefined" && value != 'undefined'){
            pos = this.sizeScale(value);
        }else{
            pos = this.sizeScale(this.max);
        }
        
        return {'pos': pos};
    }
    
    /**
     * reset and build labels <br>
     * TODO make it works with non numerical value
     * @param {number} min - minimal label value
     * @param {number} max - maximal label value
     * @param {boolean} percent - display label as percent ( value 1 => 100%)
     * @param {boolean} use_log - use a logarithmic scale instead of a linear
     * @param {boolean} has_undefined - Should we include an undefined value ?
     * */
    NumericalAxis.prototype.computeLabels = function(min, max, use_log, display_label, has_undefined){
        this.labels = [];
        if (typeof use_log === 'undefined')
            use_log = false;
        if (typeof display_label === 'undefined')
            display_label = true;
        if (typeof has_undefined == 'undefined')
            has_undefined = false
        
        var text, pos, h;
        if (use_log){
            h=1
            for (var i = 0; i < 10; i++) {
                pos = this.sizeScale(h); // pos is possibly already reversed
                text = this.m.formatSize(h, false)
                if (!display_label) text = "";
                if (pos >= 0 && pos <= 1)
                    this.addLabel("line", text, pos, text);
                h = h / 10;
            }
        }else{
            var nb_steps = this.NB_STEPS_IN_AXIS-1
            undefined_min = min
            // Recover the initial min value
            if (has_undefined) {
                min = (min*this.NB_STEPS_IN_AXIS + max)/(this.NB_STEPS_IN_AXIS + 1)
            }

            nb_step = this.computeSteps(max, nb_steps);

            h = (max-min)/nb_steps
            // Computed so that pos <= 1 (in the loop below)
            var delta = (min - max)/((min - undefined_min)/(max-undefined_min) - 1)
            if (has_undefined)
                this.labels.push(this.label("line", (this.reverse) ? 0 : 1, "?"))
            // Shift the start when there is an undefined value
            var start_shift = (min - undefined_min)/(max-undefined_min)
            for (var j = 0; j <= nb_steps; j++) {
                pos = (h*j)*(1/delta);

                text = this.getLabelText(h*j);
                if (this.reverse) pos = 1 - pos;
                if (!display_label) text = "";
                this.addLabel("line", text, pos, text);
            }
        }
    }

    NumericalAxis.prototype.computeSteps = function(min, max, nb_steps) {
        var steps = nb_steps;
        if (Math.abs(max - min) < nb_steps) {
            steps = Math.abs(max - min)
        }
        return steps;
    }

    NumericalAxis.prototype.getLabelText = function (value) {
        return Math.round(value);
    }

    NumericalAxis.prototype.applyConverter = function (element) {
        var value;
        try{
            value = this.converter(element);
        }catch(e){
            value = undefined;
        }
        return value;
    }

function PercentAxis (model, reverse, can_undefined) {
    this.m = model;
    this.labels = [];
    this.reverse = reverse;
    NumericalAxis.call(this, model, reverse, can_undefined);
}

PercentAxis.prototype = Object.create(NumericalAxis.prototype);

    PercentAxis.prototype.computeSteps = function(min, max, nb_steps) {
        return nb_steps;
    }

    PercentAxis.prototype.getLabelText = function(value) {
        return floatToFixed(value*100, 4) + "%"
    }

/**
 * Axis object contain labels and their position on an axis (from 0 to 1) <br>
 * can provide the position of a clone on it
 * @constructor
 * @param {Model} model
 * @reverse {boolean} reverse - by default axis go from low to high but can be revsersed
 * */
function FloatAxis (model, reverse, can_undefined) {
    this.m = model;
    this.labels = [];
    this.reverse = reverse;
    NumericalAxis.call(this, model, reverse, can_undefined);
}

FloatAxis.prototype = Object.create(NumericalAxis.prototype);

    FloatAxis.prototype.getLabelText = function(value) {
        return (value).toFixed(2)
    }
