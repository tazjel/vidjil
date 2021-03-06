/*
 * This file is part of Vidjil <http://www.vidjil.org>,
 * High-throughput Analysis of V(D)J Immune Repertoire.
 * Copyright (C) 2013-2017 by Bonsai bioinformatics
 * at CRIStAL (UMR CNRS 9189, Université Lille) and Inria Lille
 * Contributors: 
 *     Marc Duez <marc.duez@vidjil.org>
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

function Builder(model, database) {
    if (typeof model != "undefined"){
        View.call(this, model);
    }

    if(typeof database != 'undefined') {
        this.db = database;
    }
    this.colorMethod = "";
    this.width_left_container = $("#left-container")
        .css("width")

    this.drag_separator = false
}

//TODO need a reset function

Builder.prototype = {

    init: function () {
        var self = this;
        try {
            d3.select("#visu-separator")
                .on("mousedown", function () {
                    self.dragSeparator();
                });
            d3.select("#visu-container")
                .on("mouseup", function () {
                    self.dropSeparator()
                })
            d3.select("#visu-container")
                .on("mousemove", function () {
                    self.updateSeparator()
                })
            d3.select("#vertical-separator")
                .on("click", function () {
                    self.toggle_left_container()
                });

            this.build_top_container()
            this.build_clusterSelector()
            this.initTag();

            if (this.m.samples.order.length == 1) this.resizeGraph(0) 
            else this.resizeGraph(50)

        } catch (err) {
            sendErrorToDb(err, this.db);
        }
    },

    update: function () {
        try {
            this.build_top_container()
            this.updateTagBox();
        } catch(err) {
            sendErrorToDb(err, this.db);
        }
    },
    
    updateElem: function () {},

    updateElemStyle: function () {},

    resize: function () {},

    dragSeparator: function () {
        this.drag_separator = true;
    },

    updateSeparator: function () {
        if (this.drag_separator) {
            var coordinates = [0, 0];
            coordinates = d3.mouse(d3.select("#visu-container")
                .node());

            var position = coordinates[1]
            var total_height = document.getElementById("visu-container")
                .offsetHeight;

            if (position < 2 || total_height - position < 2) this.dropSeparator()

            var height = position / total_height * 100
            if (height > 90) height = 100;
            if (height < 10) height = 0;
            
            this.resizeGraph(height)
        }
    },
    
    resizeGraph : function (graphSize) {
        var spSize = 100 - graphSize

        document.getElementById("visu")
            .style.height = spSize + "%"
        document.getElementById("visu2")
            .style.height = graphSize + "%"
    },

    dropSeparator: function () {
        if (this.drag_separator) {
            this.drag_separator = false;

            var sel = window.getSelection();
            sel.removeAllRanges();
            this.m.resize();
        }
    },
    
    build_settings: function () {
        var self = this;
        var normalize_list = document.getElementById("normalize_list");
        normalize_list.removeAllChildren();

        var input = document.createElement("input");
        input.type = "radio";
        input.value= -1;
        input.name = "normalize_list";
        input.id = "reset_norm";
        input.checked=true;
        
        var div = document.createElement("div");
        div.onclick = function () {
            self.m.compute_normalization(-1) ;
            this.firstChild.checked=true;
            self.m.update();
        };
        div.className="buttonSelector";
        div.appendChild(input);
        div.appendChild(document.createTextNode("none"));
        
        normalize_list.appendChild(div);
        
        // Regroup Clones and Data into a single array with only critical data
        var divElements = [];
        for (var i = 0; i < self.m.clones.length; ++i) {
            if (typeof self.m.clone(i).expected != "undefined") {
                divElements.push({
                    id: i,
                    name: self.m.clone(i).getName(),
                    expected: self.m.clone(i).expected
                });
            }
        }
        
        for (var key in self.m.data) {
            if (typeof self.m.data[key].expected != "undefined") {
                divElements.push({
                    id: key,
                    name: self.m.data[key],
                    expected: self.m.data[key].expected
                });
            }
        }

        // Create clickable div for each Clone and Data Entry
        for (var j = 0; j < divElements.length; ++j) {
            var elem = self.setupNormalizeDiv(divElements[i], "buttonSelector");
            console.log(elem);
            normalize_list.appendChild(elem);
        }
        
    },

    
    /* Fonction servant à "déverouiller" l'appel de la fonction compute_normalization(), ainsi qu'à apposer le 'check' au checkBox 'normalize'
     * */
    displayNormalizeButton: function() {
    var normalizeDiv = document.getElementById("normalizeDiv");
    normalizeDiv.style.display="";
	var normalizeCheckbox = document.getElementById("normalize");
	this.m.normalization_switch(true);
    normalizeCheckbox.disabled = false;
	normalizeCheckbox.checked = true;
    },
    
    /* 
     * */
    editTagName: function (tagID, elem) {
        var self = this;
        var divParent = elem.parentNode;
        divParent.removeAllChildren();

        var input = this.setupInput("new_tag_name", "", "text", this.m.tag[tagID].name);
        input.style.width = "100px";
        input.style.border = "0px";
        input.style.margin = "0px";
        input.onkeydown = function (e) {
            e = e || window.event;
            var key = e.keyCode;
            if (key === 0) key = e.which ;
            if (key === 13) document.getElementById('btnSaveTag')
                .click();
        };
        divParent.appendChild(input);
        divParent.onclick = "";

        var a = document.createElement('a');
        a.className = "button";
        a.appendChild(document.createTextNode("save"));
        a.id = "btnSaveTag";
        a.onclick = function (event) {
            event.stopPropagation();
            event.preventDefault();
            var newTagName = document.getElementById("new_tag_name")
                .value;
            self.m.tag[tagID].name = newTagName;
            self.m.analysisHasChanged = true;
        };
        divParent.appendChild(a);
        $('#new_tag_name')
            .select();
    },

    buildListTab: function(i) {
        var span3 = document.createElement('span');
        span3.onclick = function (tag) {
            self.editTagName(i, this);
        }
        span3.className = "edit_button"
        span3.appendChild(document.createTextNode("..."))

        var span1 = document.createElement('span');
        span1.className = "tagColorBox tagColor" + i

        var span2 = document.createElement('span');
        span2.className = "tagName" + i + " tn"

        var div = document.createElement('div');
        div.className = "tagElem"
        div.id = "tagDisplay" + i
        div.onclick = function () {
            self.nextDisplayTag(this)
        }
        div.appendChild(span1)
        div.appendChild(span2)
        div.appendChild(span3)

        var li = document.createElement('li');
        li.appendChild(div)

        listTag.appendChild(li);
    },

    buildSystemSelector: function (system){
        var self = this
        var radio=document.createElement("input");
            radio.type="radio";
            radio.name="germline";
            radio.value=system
            if (this.m.germlineV.system==system) radio.checked=true

        div = document.createElement('div');
        div.onclick = function(){
            self.m.changeGermline(system, false)
        }
        div.className="buttonSelector"
        div.appendChild(radio)
        div.appendChild(document.createTextNode(system))

        li = document.createElement('li');
        li.appendChild(div)
        // listGermline.appendChild(li);
    },

    /*complete displaySelector menu with correct info about current tagname / top
     * */
    build_displaySelector: function () {
        var self = this;

        var displaySelector = document.getElementById("displaySelector")
        var listTag = document.getElementById("tagList")
        // var listGermline = document.getElementById("germline_list")
        
        //reset
        listTag.removeAllChildren();
        // listGermline.removeAllChildren();

        //init tag list
        for (var i = 0; i < this.m.tag.length; i++) {
            this.buildListTab(i);
        }

        //init slider
        var max_top = 0;
        for (var j = 0; j < this.m.clones.length; j++) {
            if (this.m.clone(j).top > max_top)
                max_top = this.m.clone(j).top
        }
        max_top = (Math.ceil(max_top / 5)) * 5
        document.getElementById("top_slider")
            .max = max_top;
            
        //init notation
        if (this.m.notation_type == "scientific") {
            document.getElementById("notation").checked = true
        }
        
        //init system
        if (this.m.system == "multi") {
            $("#system_menu").css("display", "")
            $("#color_system_button").css("display", "")
            
            for (var key in this.m.system_available) {
                var system = this.m.system_available[key];
                this.buildSystemSelector(system);
            }
             
        }else{
            $("#system_menu").css("display", "none")
            $("#color_system_button").css("display", "none")
        }

        this.initTag();
    },
    
    //TODO need to build complete Selector 
    build_clusterSelector: function () {
        var self = this;
    /*
        var clusterSelector = document.getElementById("cluster_menu")
        clusterSelector.removeAllChildren();
        
        if (self.m.clones[0]._target){
        
            var target = document.createElement('a');
                target.className = "buttonSelector"
                target.onclick = function () { m.clusterBy(function(id){return m.clone(id)['_target']});}
                target.appendChild(document.createTextNode("target"));
            clusterSelector.appendChild(target)
            
            var targetV = document.createElement('a');
                targetV.className = "buttonSelector"
                targetV.onclick = function () { m.clusterBy(function(id){return m.clone(id)['_target.V-GENE']});}
                targetV.appendChild(document.createTextNode("target V"));
            clusterSelector.appendChild(targetV)
            
            var targetJ = document.createElement('a');
                targetJ.className = "buttonSelector"
                targetJ.onclick = function () { m.clusterBy(function(id){return m.clone(id)['_target.J-GENE']});} 
                targetJ.appendChild(document.createTextNode("target J"));
            clusterSelector.appendChild(targetJ)
            
            var clonotype = document.createElement('a');
                clonotype.className = "buttonSelector"
                clonotype.onclick = function () { m.clusterBy(function(id){return m.clone(id)['_clonotype']});} 
                clonotype.appendChild(document.createTextNode("clonotype"));
            clusterSelector.appendChild(clonotype)
        }
    */
    },

    toggle_left_container: function () {
        $("#left-container").toggle()
        this.m.resize();
    },

    build_top_container: function () {
        var self = this;
        var parent = document.getElementById("top_info");
        parent.removeAllChildren();
        parent.appendChild(document.createTextNode(this.m.getPrintableAnalysisName()));

        var selector = document.createElement('div');
        selector.className = 'selector';
        selector.id = 'patientSelector';
        parent.appendChild(selector);
        var interm = document.createElement('div');
        selector.appendChild(interm);
        var menu_box = document.createElement('div');
        menu_box.className = "menu_box";
        interm.appendChild(menu_box);

        if (typeof this.m.sample_set_id != 'undefined') {
            var open_patient = document.createElement('a');
            open_patient.className = "buttonSelector";
            open_patient.appendChild(document.createTextNode("open"));
	    open_patient.onclick = function() {
	        db.call('sample_set/index', {'id' : self.m.sample_set_id});
	    }
            menu_box.appendChild(open_patient);

            var save_analysis = document.createElement("a");
            save_analysis.className = "buttonSelector"
            save_analysis.appendChild(document.createTextNode("save"));
            save_analysis.onclick = function() {
                db.save_analysis();
            }
            menu_box.appendChild(save_analysis);
        }

        $(parent).on('mouseover', function() {
            showSelector('patientSelector');
        })
        document.title = this.m.getPrintableAnalysisName()
    },

    initTag: function (){
        for (var i =0; i<this.m.tag.length; i++){
            $(".tagColor"+i).prop("title", this.m.tag[i].name);
            $(".tagName"+i).html(this.m.tag[i].name);
        }
        this.updateTagBox();
    },
    
  
    updateTagBox: function(){
        for (var i =0; i<this.m.tag.length; i++){
            if (this.m.tag[i].display){
                $(".tagColor"+i).removeClass("inactiveTag")
            }else{
                $(".tagColor"+i).addClass("inactiveTag")
            }
        }
    },
    
    nextDisplayTag: function(elem){
        var id_tag = elem.id.charAt( elem.id.length-1 ) 
        var s = this.m.tag[id_tag].display;
        this.m.tag[id_tag].display = !s;
        this.m.update();
    },

    // Build an html input tag
    setupInput: function(id, name, type, value) {
        var input = document.createElement("input");
        if(id !== "") input.id = id;
        if(name !== "") input.name = name;
        if(value !== "") input.value = value;
        input.type = type;
        return input;
    },

    // Build a clickable div element that triggers model update
    setupNormalizeDiv: function(elem, className) {
        var self = this;
        var div = document.createElement("div");
        var inputNode = this.setupInput("", "normalize_list", "radio", elem.id);
        if (this.m.normalization.id == elem.id) input.checked = true;
        var textNode = document.createTextNode(elem.name + " → " + elem.expected);

        div.onclick = function () {
            self.m.compute_data_normalization(this.firstChild.value);
            this.firstChild.checked = true;
            self.m.update();
        }

        div.className = className;
        div.appendChild(inputNode);
        div.appendChild(textNode);
        return div;
    },
}
