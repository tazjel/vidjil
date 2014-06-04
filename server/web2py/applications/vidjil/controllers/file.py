# coding: utf8

def add(): 
    import gluon.contrib.simplejson
    if request.env.http_origin:
        response.headers['Access-Control-Allow-Origin'] = request.env.http_origin  
        response.headers['Access-Control-Allow-Credentials'] = 'true'
        response.headers['Access-Control-Max-Age'] = 86400
    if auth.has_permission('admin', 'patient', request.vars['id'], auth.user_id):
        return dict(message=T('add file'))
    else :
        res = {"success" : "false", "message" : "you need admin permission on this patient to add file"}
        return gluon.contrib.simplejson.dumps(res, separators=(',',':'))


#TODO check data
def add_form(): 
    import gluon.contrib.simplejson, shutil, os.path, datetime
    if request.env.http_origin:
        response.headers['Access-Control-Allow-Origin'] = request.env.http_origin  
        response.headers['Access-Control-Allow-Credentials'] = 'true'
        response.headers['Access-Control-Max-Age'] = 86400
        
    error = ""
    
    if request.vars['sampling_date'] != None :
        try:
            datetime.datetime.strptime(""+request.vars['sampling_date'], '%Y-%m-%d')
        except ValueError:
            error += "date missing or wrong format, "
            
    if error=="" :
        id = db.sequence_file.insert(sampling_date=request.vars['sampling_date'],
                            info=request.vars['file_info'],
                            patient_id=request.vars['patient_id'])
    
        res = {"file_id" : id,
               "message": "info file added",
               "redirect": "patient/info",
               "args" : {"id" : request.vars['patient_id']}
               }
        return gluon.contrib.simplejson.dumps(res, separators=(',',':'))
        
    else :
        res = {"success" : "false", "message" : error}
        return gluon.contrib.simplejson.dumps(res, separators=(',',':'))


def edit(): 
    if request.env.http_origin:
        response.headers['Access-Control-Allow-Origin'] = request.env.http_origin  
        response.headers['Access-Control-Allow-Credentials'] = 'true'
        response.headers['Access-Control-Max-Age'] = 86400
    return dict(message=T('edit file'))


#TODO check data
def edit_form(): 
    import gluon.contrib.simplejson, shutil, os.path, datetime
    if request.env.http_origin:
        response.headers['Access-Control-Allow-Origin'] = request.env.http_origin  
        response.headers['Access-Control-Allow-Credentials'] = 'true'
        response.headers['Access-Control-Max-Age'] = 86400
    
    error = ""
    
    if request.vars['id'] == None :
        error += "missing id"
            
    if error=="" :

        mes = "file " + request.vars['id'] + " : "
        if request.vars['sampling_date'] != None :
            db.sequence_file[request.vars["id"]] = dict(sampling_date=request.vars['sampling_date'])
            mes += "sampling date saved, "
            
        if request.vars['file_info'] != None :
            db.sequence_file[request.vars["id"]] = dict(info=request.vars['file_info'])
            mes += "info saved, "
            
        patient_id = db.sequence_file[request.vars["id"]].patient_id
        
        res = {"file_id" : request.vars['id'],
               "redirect": "patient/info",
               "args" : { "id" : patient_id},
               "message": mes}
        return gluon.contrib.simplejson.dumps(res, separators=(',',':'))

def upload(): 
    import gluon.contrib.simplejson, shutil, os.path, datetime
    if request.env.http_origin:
        response.headers['Access-Control-Allow-Origin'] = request.env.http_origin  
        response.headers['Access-Control-Allow-Credentials'] = 'true'
        response.headers['Access-Control-Max-Age'] = 86400
    
    error = ""
    
    if request.vars['id'] == None :
        error += "missing id"
            
    if error=="" :
            
        mes = "file " + request.vars['id'] + " : "
        if request.vars.file != None :
            db.sequence_file[request.vars["id"]] = dict(data_file = request.vars.file )
            mes += "file saved, "
            
        patient_id = db.sequence_file[request.vars["id"]].patient_id
        
        res = {"message": mes}
        return gluon.contrib.simplejson.dumps(res, separators=(',',':'))
  

def confirm():
    if request.env.http_origin:
        response.headers['Access-Control-Allow-Origin'] = request.env.http_origin  
        response.headers['Access-Control-Allow-Credentials'] = 'true'
        response.headers['Access-Control-Max-Age'] = 86400
    return dict(message=T('confirm sequence file deletion'))
        

def delete():
    import gluon.contrib.simplejson, shutil, os.path
    if request.env.http_origin:
        response.headers['Access-Control-Allow-Origin'] = request.env.http_origin  
        response.headers['Access-Control-Allow-Credentials'] = 'true'
        response.headers['Access-Control-Max-Age'] = 86400

    db(db.sequence_file.id == request.vars["id"]).delete()
    db(db.data_file.sequence_file_id == request.vars["id"]).delete()
    
    res = {"redirect": "patient/index",
           "message": "sequence file deleted"}
    return gluon.contrib.simplejson.dumps(res, separators=(',',':'))
