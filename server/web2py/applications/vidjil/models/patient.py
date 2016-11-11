class Patient(SampleSet):
    def __init__(self, data):
        super(Patient, self).__init__(data)
        self.last_name = data.last_name
        self.birth = data.birth
        #TODO
        self.anon_allowed = True

    def get_fields(self):
        fields = super(Patient, self).get_fields()
        fields[0] = {'name': 'name', 'sort': 'last_name', 'call': self.get_name, 'width': 100, 'public': True}
        fields.insert(1, {'name': 'birth', 'sort': 'birth', 'call': self.get_birth, 'width': 100, 'public': True})
        print fields
        return fields

    def get_name(self):
        return vidjil_utils.anon_names(self.id, self.name, self.last_name, self.anon_allowed)

    def get_birth(self):
        return self.birth

def get_patient(id):
    data = db.sample_set[id]
    return Patient(data)