/*
 * This file is part of "Vidjil" <http://bioinfo.lifl.fr/vidjil>, V(D)J repertoire browsing and analysis
 * Copyright (C) 2013, 2014 by Marc Duez <marc.duez@lifl.fr> and the Vidjil Team
 * Bonsai bioinformatics at LIFL (UMR CNRS 8022, Université Lille) and Inria Lille
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


/* Com object display/store system message
 * 
 * */
function Com(flash_id, log_id, popup_id, data_id) {
    this.flash_id = flash_id;
    this.log_id = log_id;
    this.popup_id = popup_id
    this.data_id = data_id;
    
    this.min_priority = 1; // minimum required to display message
    this.log_container = document.getElementById(this.log_id);
    
    BUTTON_CLOSE_POPUP = "</br></br> <div class='center' > <button onclick='myConsole.closePopupMsg()'>ok</button></div>",

    this.msg = {
        "align_error": "Error &ndash; connection to align server ("+return_URL_CGI()+") failed" + "</br> Please check your internet connection and retry." 
	    + BUTTON_CLOSE_POPUP,

        "file_error": "Error &ndash; incorrect .vidjil file" + "</br> Please check you use a .vidjil file generated by a compatible program." 
	    + BUTTON_CLOSE_POPUP,

        "parse_error": "Error &ndash; error in parsing the .vidjil file" 
	    + "</br> The .vidjil file seems broken, please check it or "
	    + "<a href='mailto:contact@vidjil.org?Subject=%5Bvidjil%5D%20Parse%20error&Body=%0AHi%2C%0A%0AThe%20attached%20.vidjil%20file%20does%20not%20load%20into%20the%20browser%2C%20could%20you%20check%20it%20%3F%0A%0A'>send us</a> the file"
	    + BUTTON_CLOSE_POPUP,

        "json_not_found":"Error &ndash; editDistanceFile.json not found"
	    + "</br> Please to check the specified repository in the c++ program, or to run Vidjil program with the specified datas." 
	    + BUTTON_CLOSE_POPUP,

        "version_error": "Error &ndash; .vidjil file too old (version " + VIDJIL_JSON_VERSION + " required)" 
	    + "</br> This .vidjil file was generated by a too old program. " 
	    + "</br> Please regenerate a newer .vidjil file. "
	    + BUTTON_CLOSE_POPUP,

        "welcome": " <h2>Vidjil <span class='logo'>(beta)</span></h2>"
	    + "(c) 2011-2014, the Vidjil team" + "<br />Marc Duez, Mathieu Giraud and Mikaël Salson" 
	    + " &ndash; <a href='http://www.vidjil.org'>http://www.vidjil.org/</a>" + "</br>" 
	    + "</br>Vidjil is developed by the <a href='http://www.lifl.fr/bonsai'>Bonsai bioinformatics team</a> (LIFL, CNRS, U. Lille 1, Inria Lille), " 
	    + "in collaboration with the <a href='http://biologiepathologie.chru-lille.fr/organisation-fbp/91210.html'>department of Hematology</a> of CHRU Lille, " 
            + "the <a href='http://www.ircl.org/plate-forme-genomique.html'>Functional and Structural Genomic Platform</a> (U. Lille 2, IFR-114, IRCL)" 
	    + " and the <a href='http://www.euroclonality.org/'>EuroClonality-NGS</a> working group." 
	    + "<br/>" 
	    + "<br>Vidjil is free software, and you are welcome to redistribute it under <a href='http://git.vidjil.org/blob/master/doc/LICENSE'>certain conditions</a>. This software is for research use only and comes with no warranty." 
	    + "<br>" 
	    + "Please cite <a href='http://www.biomedcentral.com/1471-2164/15/409'>BMC Genomics 2014, 15:409</a> if you use Vidjil for your research."
	    + BUTTON_CLOSE_POPUP,

        "browser_error": "The web browser you are using has not been tested with Vidjil." 
	    + "</br>Note in particular that Vidjil is <b>not compatible</b> with Internet Explorer 9.0 or below." 
	    +"</br>For a better experience, we recommend to install one of those browsers : "
	    + "</br> <a href='http://www.mozilla.org/'> Firefox </a> " 
	    + "</br> <a href='www.google.com/chrome/'> Chrome </a> " 
	    + "</br> <a href='http://www.chromium.org/getting-involved/download-chromium'> Chromium </a> "
	    + "</br></br> <div class='center' > <button onclick='popupMsg(msg.welcome)'>I want to try anyway</button></div>",
    }
    
    
}

Com.prototype = {
    
    /* display a flash message if priority level is sufficient
     * and print message in log
     * */
    flash: function (str, priority){
        priority = typeof priority !== 'undefined' ? priority : 0;
        
        if (priority >= this.min_priority){
            var div = jQuery('<div/>', {
                text: str,
                style: 'display : none',
                class: 'flash_'+priority ,
                click : function(){$(this).fadeOut(25, function() { $(this).remove();} );}
            }).appendTo("#"+this.flash_id)
            .slideDown(200);
            
            if (priority !=2){
                setTimeout(function(){
                    div.fadeOut('slow', function() { div.remove();});
                }, 8000);
            }
            
        }
        
        this.log(str, priority);
    },
    
    /* print message in log_container if priority level is sufficient (else use javascript default console)
     * 
     * */
    log: function(str, priority){
        priority = typeof priority !== 'undefined' ? priority : 0;
        var self = this;
        
        if (priority >= this.min_priority){
            
            var d = new Date();
            var strDate = d.getHours() + ":" + d.getMinutes() + ":" + d.getSeconds();
            while (strDate.length < 8) strDate += " "
                
            var div = jQuery('<div/>', {
                text: strDate+" | "+str,
                class: 'log_'+priority
            }).appendTo("#"+this.log_id)
            .slideDown(200, function(){
                self.log_container.scrollTop = self.log_container.scrollHeight;
            });
            
        }else{
            console.log(str)
        }
        
    },
    
    openLog: function () {
        $("#"+this.log_id).fadeToggle(200)
    },
    
    closeLog: function () {
        $("#"+this.log_id).fadeToggle(200)
    },
    
    popupMsg: function (msg) {
        document.getElementById(this.popup_id)
            .style.display = "block";
        document.getElementById(this.popup_id).lastElementChild
            .innerHTML = msg;
    },

    closePopupMsg: function () {
        document.getElementById(this.popup_id)
            .style.display = "none";
        document.getElementById(this.popup_id).lastElementChild
            .innerHTML = "";
    },

    dataBox: function(msg) {
        document.getElementById(this.data_id)
            .style.display = "block";
        document.getElementById(this.data_id).lastElementChild
            .innerHTML = msg;
    },

    closeDataBox: function() {
        document.getElementById(this.data_id)
            .style.display = "none";
        document.getElementById(this.data_id).lastElementChild
            .innerHTML = "";
    },
    
}
