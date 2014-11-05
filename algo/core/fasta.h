#ifndef FASTA_H
#define FASTA_H

#include <istream>
#include <string>
#include <vector>
#include <list>

using namespace std;

typedef string seqtype ;

typedef struct read_t
{
  string label_full;
  string label;
  string sequence; // Sequence: original string representation
  string quality;
  int*   seq;      // Sequence: seq representation
} Sequence;

typedef enum {
  FASTX_UNINIT, FASTX_FASTA,
  FASTX_FASTQ_ID, FASTX_FASTQ_SEQ,
  FASTX_FASTQ_SEP, FASTX_FASTQ_QUAL
} fasta_state;

#include "tools.h"

class Fasta
{
        void init(int extract_field, string extract_separator);

        int total_size;
        int extract_field;
	string extract_separator;
	
	vector<Sequence> reads;
	// ostream *oout ;

public:
        Fasta(int extract_field=0, string extract_separator="|");
        /**
         * Read all the sequences in the input filename and record them in the object.
         *
       */
	Fasta(const string &input, 
	      int extract_field=0, string extract_separator="|");
	
	int size() const;
        /**
         * Get all the sequences from the FASTA file
         * @return a list of sequences in the same order as in the input file
         */
        list<Sequence> getAll() const;
	const string& label(int index) const;
	const string& label_full(int index) const;
        const Sequence &read(int index) const;
	const string& sequence(int index) const;

        void add(istream &in);
        void add(const string &filename);
	
	friend istream& operator>>(istream&, Fasta&);
};

/**
 * Read a FASTA/FASTQ file.
 * Space complexity: constant. Only one sequence is stored at most in memory.
 * The file is read online meaning that we cannot access a random sequence.
 */
class OnlineFasta {
 private:
  Sequence current;
  istream *input;
  int extract_field;
  string extract_separator;
  string line;
  bool input_allocated;
  size_t line_nb;

 public:

  /**
   * Default constructor
   */
  OnlineFasta(int extract_field=0, string extract_separator="|");

  /**
   * Open the file and read the first sequence.
   * @post getSequence() does not return the first sequence yet. 
   *       next() must be called first.
   */
  OnlineFasta(const string &input, 
              int extract_field=0, string extract_separator="|");

  OnlineFasta(istream &input, 
              int extract_field=0, string extract_separator="|");

  ~OnlineFasta();
  
  /**
   * @return the current line number
   */
  size_t getLineNb();

  /**
   * @return the current sequence or an undetermined sequence if the end
   * of the file is reached
   */
  Sequence getSequence();

  /**
   * @return true iff we did not reach yet the end of the file.
   */
  bool hasNext();

  /**
   * Go to the next sequence in the file.
   * @post hasNext() ==> getSequence() returns the following sequence in the file.
   */
  void next();

 private:

  /**
   * Initialisation of the object
   */
  void init();

  /**
   * Reads line in the input stream until we have a line with at least one
   * non-whitespace character.
   * @return A non-empty string whose trailing whitespaces have been removed
   */
  string getInterestingLine();

  /**
   * Called when we have an unexcepted EOF.
   * @throws exception
   */
  void unexpectedEOF();
};

istream& operator>>(istream& in, Fasta& fasta);
ostream& operator<<(ostream& out, Fasta& fasta);
ostream &operator<<(ostream &out, const Sequence &seq);

#endif
