#!/usr/bin/python

import unittest
from gluon.globals import Request, Session, Storage, Response
from gluon.contrib.test_helpers import form_postvars
from gluon import current

class PatientController(unittest.TestCase):
        
    def __init__(self, p):
        global auth, session, request
        unittest.TestCase.__init__(self, p)
        
    def setUp(self):
        # Load the to-be-tested file
        execfile("applications/vidjil/controllers/patient.py", globals())
        # set up default session/request/auth/...
        global response, session, request, auth
        session = Session()
        request = Request({})
        auth = VidjilAuth(globals(), db)
        auth.login_bare("test@vidjil.org", "1234")
        
        # rewrite info / error functions 
        # for some reasons we lost them between the testRunner and the testCase but we need them to avoid error so ...
        def f(a, **kwargs):
            pass
        log.info = f
        log.error = f
        log.debug = f
        
        # for defs
        current.db = db
        current.auth = auth
        
        auth.add_permission(group_id, 'admin', db.patient, 0)
        auth.add_permission(group_id, 'read', db.patient, 0)
        auth.add_permission(group_id, 'create', db.patient, 0)
        
    def testAdd(self):
        resp = add()
        self.assertTrue(resp.has_key('message'), "add() has returned an incomplete response")
        
        
    def test1AddForm(self):
        request.vars["first_name"] = "bob"
        request.vars["last_name"] = "bob"
        request.vars["birth"] = "2011-11-11"
        request.vars["info"] = "test patient kZtYnOipmAzZ"
        request.vars["id_label"] = "bob"
        request.vars["patient_group"] = fake_group_id

        name = "%s %s" % (request.vars["first_name"], request.vars["last_name"])
        
        resp = add_form()
        self.assertNotEqual(resp.find('patient %s added' % name), -1, "add patient failled")

        
        
    def testEdit(self):
        request.vars["id"] = fake_patient_id
        
        resp = edit()
        self.assertTrue(resp.has_key('message'), "edit() has returned an incomplete response")
        
        
    def testEditForm(self):
        request.vars["id"] = fake_patient_id
        request.vars["first_name"] = "bab"
        request.vars["last_name"] = "bab"
        request.vars["birth"] = "2010-10-10"
        request.vars["info"] = "bab"
        request.vars["id_label"] = "bab"
        
        resp = edit_form()
        self.assertNotEqual(resp.find('bab bab (1): patient edited"'), -1, "edit patient failed")
        
        
    def testConfirm(self):
        request.vars["id"] = fake_patient_id
        
        resp = confirm()
        self.assertTrue(resp.has_key('message'), "confirm() has returned an incomplete response")
        
        
    def test4Delete(self):
        patient_id = db( db.patient.info == "test patient kZtYnOipmAzZ").select()[0].id
        request.vars["id"] = patient_id
        
        resp = delete()
        self.assertNotEqual(resp.find('patient ('+str(patient_id)+') deleted'), -1, "delete patient failed")
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        