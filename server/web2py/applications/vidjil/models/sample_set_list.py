class SampleSetList():
    def __init__(self, type, page=None, step=None):
        self.type = type

        limitby = None
        if page is not None and step is not None:
            limitby = (page*step, (page+1)*step+1) # one more element to indicate if another page exists

        query_gss = db(
            (auth.vidjil_accessible_query(PermissionEnum.read.value, db[type]))
        ).select(
            db[type].ALL,
            limitby = limitby,
            orderby = ~db[type].id
        )

        step = len(query_gss) if step is None else step
        auth.load_permissions(PermissionEnum.admin.value, type)
        auth.load_permissions(PermissionEnum.anon.value, type)
        self.elements = {}
        for row in query_gss:
            self.elements[row.id] = row
            self.elements[row.id].file_count = 0
            self.elements[row.id].size = 0
            self.elements[row.id].conf_list = []
            self.elements[row.id].conf_id_list = [-1]
            self.elements[row.id].most_used_conf = ""
            self.elements[row.id].groups = ""
            self.elements[row.id].group_list = []
            self.elements[row.id].has_permission = auth.can_modify(type, row.id)
            self.elements[row.id].anon_allowed = auth.can_view_info(type, row.id)

        self.element_ids = self.elements.keys()

    def load_creator_names(self):
        query_creator = db(
            (db[self.type].creator == db.auth_user.id)
            & (db[self.type].id.belongs(self.element_ids))
        ).select(
            db[self.type].id, db.auth_user.last_name
        )
        for i, row in enumerate(query_creator) :
            self.elements[row[self.type].id].creator = row.auth_user.last_name

    def load_sample_information(self):
        query_sample = db(
            (db.sample_set_membership.sample_set_id == db[self.type].sample_set_id)
            &(db.sequence_file.id == db.sample_set_membership.sequence_file_id)
            &(db[self.type].id.belongs(self.element_ids))
        ).select(
            db[self.type].id, db.sequence_file.size_file
        )
         
        for i, row in enumerate(query_sample) :
            self.elements[row[self.type].id].file_count += 1
            self.elements[row[self.type].id].size += row.sequence_file.size_file

    def load_config_information(self):
        query = db(
            (db[self.type].sample_set_id == db.fused_file.sample_set_id) &
            (db.fused_file.config_id == db.config.id) &
            (auth.vidjil_accessible_query(PermissionEnum.read_config.value, db.config) |
                auth.vidjil_accessible_query(PermissionEnum.admin_config.value, db.config) ) &
            (db[self.type].id.belongs(self.element_ids))
        ).select(
            db[self.type].id, db.config.name, db.config.id, db.fused_file.fused_file
        )

        for i, row in enumerate(query) :
            self.elements[row[self.type].id].conf_list.append(
                    {'id': row.config.id, 'name': row.config.name, 'fused_file': row.fused_file.fused_file})
            self.elements[row[self.type].id].conf_id_list.append(row.config.id)

        for key, row in self.elements.iteritems():
            row.most_used_conf = max(set(row.conf_id_list), key=row.conf_id_list.count)
            row.confs = ", ".join(list(set(map(lambda elem: elem['name'], row.conf_list)))) 

    def load_permitted_groups(self):
        query = db(
            ((db[self.type].id == db.auth_permission.record_id) | (db.auth_permission.record_id == 0)) &
            (db.auth_permission.table_name == self.type) &
            (db.auth_permission.name == PermissionEnum.access.value) &
            (db.auth_group.id == db.auth_permission.group_id)
            & (db[self.type].id.belongs(self.element_ids))
        ).select(
            db[self.type].id, db.auth_group.role
        )
        for i, row in enumerate(query) :
            self.elements[row[self.type].id].group_list.append(row.auth_group.role.replace('user_','u'))

        for key, row in self.elements.iteritems():
            row.groups = ", ".join(filter(lambda g: g != 'admin', set(row.group_list)))

    def load_anon_permissions(self):
        query = db(
            (db.auth_permission.name == "anon") &
            (db.auth_permission.table_name == self.type) &
            (db[self.type].id == db.auth_permission.record_id ) &
            (db.auth_group.id == db.auth_permission.group_id ) &
            (db.auth_membership.user_id == auth.user_id) &
            (db.auth_membership.group_id == db.auth_group.id) &
            (db[self.type].id.belongs(self.element_ids))
        ).select(
            db[self.type].id
        )
        for i, row in enumerate(query) :
            self.elements[row.id].anon_allowed = True

    def get_values(self):
        return self.elements.values()

    def __len__(self):
        return len(self.element_ids)
