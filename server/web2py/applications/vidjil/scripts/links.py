
import defs
import vidjil_utils
import argparse


parser = argparse.ArgumentParser(description='Output shell commands to link sequences and/or results file from the DB to human-readable names',
                                 epilog='At least -s or -r should be used')
parser.add_argument('--sequences', '-s',  action='store_true', help='link sequence files')
parser.add_argument('--results', '-r',  action='store_true', help='link results files')
parser.add_argument('--diag', '-d',  action='store_true', help='link only diagnosis results (first sample per patient)')
parser.add_argument('--analysis', '-a',  action='store_true', help='link analysis files (last file per patient)')
parser.add_argument('--filter', '-f', type=str, default='', help='filter on patient name or info (%(default)s), only for -s or -d')
parser.add_argument('--creator', '-c', type=int, default=0, help='filter on patient creator id, only for -s or -d')
parser.add_argument('--raw', '-w',  action='store_true', help='do not link, only display the list of raw files')
args = parser.parse_args()

our_id = 0

def patient_string(row):
    return "u%s pat-%04d (%s %s) - %s" % (row.creator, row.id, row.first_name, row.last_name, row.info.replace('\n', ' '))

def link(from_name, to_name, comments, link):
    if link:
        print "ln -s %s %s \t# %s" % (from_name, to_name, comments)
    else:
        print from_name

if args.sequences:
  print "### Sequences"

  for res in db(db.patient.id == db.sequence_file.patient_id).select():

    if args.filter:
      if not vidjil_utils.advanced_filter([res.patient.first_name,res.patient.last_name,res.patient.info], args.filter):
        continue

    if args.creator:
        if res.patient.creator != args.creator:
            continue

    our_id += 1

    link("%s/%-20s" % (defs.DIR_SEQUENCES, res.sequence_file.data_file),
         "%5s.fa" % our_id,
         "seq-%04d %-20s" % (res.sequence_file.id, res.sequence_file.filename)
         + "\t# %s" % patient_string(res.patient),
         not args.raw)

def last_result_by_file():
  for seq in db(db.sequence_file).select():
    print "===", "seq-%d" % seq.id, "\t", seq.sampling_date, "\t", seq.filename, seq.data_file
    res_with_file = []

    for res in db((db.results_file.sequence_file_id == seq.id) & (db.patient.id == seq.patient_id)).select(orderby=db.results_file.run_date):
       print "   ", "sched-%d" % res.results_file.scheduler_task_id, "\t", res.results_file.run_date, "\t", res.results_file.data_file
       if res.results_file.data_file:
              res_with_file += [res]

    if not res_with_file:
        continue

    # Takes the last result
    yield (res_with_file[-1], seq)


def last_result_by_first_point_by_patient():
    res_by_pat = {}

    for res in db((db.patient.id == db.sequence_file.patient_id)
                  & (db.results_file.sequence_file_id == db.sequence_file.id)).select(#groupby=db.patient.id,
                                                                                      orderby=db.patient.id|db.sequence_file.sampling_date|~db.results_file.run_date):

        if args.filter:
            if not vidjil_utils.advanced_filter([res.patient.first_name,res.patient.last_name,res.patient.info], args.filter):
                continue

        if args.creator:
            if res.patient.creator != args.creator:
                continue

        # Remeber only the first element
        if not str(res.patient.id) in res_by_pat:
            res_by_pat[str(res.patient.id)] = (res, res.sequence_file)

    for pat in res_by_pat:
        yield res_by_pat[pat]



if args.diag:
    print "### Results (first sample per patient)"
    gen_results = last_result_by_first_point_by_patient
elif args.results:
    print "### Results"
    gen_results = last_result_by_file
else:
    gen_results = None

if gen_results:
  for (res, seq) in gen_results():
    our_id = "pat-%04d--%3s--sched-%04d--seq-%04d--%s" % (res.patient.id, res.patient.last_name[:3],
                                                         res.results_file.scheduler_task_id,
                                                         seq.id, seq.sampling_date)
    our_id = our_id.replace(' ', '-')

    link("%s/%-20s" % (defs.DIR_RESULTS, res.results_file.data_file),
         "%5s.vidjil" % our_id,
         "seq-%04d %-20s %-10s" % (seq.id, seq.filename, seq.sampling_date)
         + "\t# %s" % patient_string(res.patient),
         not args.raw)



if args.analysis:
    print "### Analysis"

    last_id = None

    for res in db(db.patient.id == db.analysis_file.patient_id).select(orderby=db.patient.id|~db.analysis_file.analyze_date):

        # Only last saved analysis:
        if res.patient.id == last_id:
            continue
        last_id = res.patient.id

        if args.filter:
            if not vidjil_utils.advanced_filter([res.patient.first_name,res.patient.last_name,res.patient.info], args.filter):
                continue

        our_id = "pat-%04d--%3s" % (res.patient.id, res.patient.last_name[:3])
        our_id = our_id.replace(' ', '-')

        link("%s/%-20s" % (defs.DIR_RESULTS, res.analysis_file.analysis_file),
             "%s.analysis" % our_id,
             "%s" % res.analysis_file.analyze_date
             + "\t# %s" % patient_string(res.patient),
             not args.raw)


log.debug("=== links.py completed ===")

