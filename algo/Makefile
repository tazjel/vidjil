CXX?=g++
OPTIM=-O2 -DNDEBUG  $(COVERAGE) $(DEBUG)
override CXXFLAGS += -W -Wall -std=c++11 $(OPTIM)

## inspired from http://stackoverflow.com/questions/399850/best-compiler-warning-level-for-c-c-compilers/401276
PARANOID= -Wall -Weffc++ -pedantic  \
    -Wextra -Waggregate-return -Wcast-align \
    -Wcast-qual  -Wchar-subscripts  -Wcomment -Wconversion \
    -Wdisabled-optimization \
    -Wfloat-equal  -Wformat  -Wformat=2 \
    -Wformat-nonliteral -Wformat-security  \
    -Wformat-y2k \
    -Wimplicit  -Wimport  -Winit-self  -Winline \
    -Winvalid-pch   -Wlong-long -Wmissing-braces \
    -Wmissing-field-initializers -Wmissing-format-attribute   \
    -Wmissing-include-dirs -Wmissing-noreturn \
    -Wpacked  -Wpadded -Wparentheses  -Wpointer-arith \
    -Wredundant-decls -Wreturn-type \
    -Wsequence-point  -Wshadow -Wsign-compare  -Wstack-protector \
    -Wstrict-aliasing -Wstrict-aliasing=2 -Wswitch  -Wswitch-default \
    -Wswitch-enum -Wtrigraphs  -Wuninitialized \
    -Wunknown-pragmas  -Wunreachable-code -Wunused \
    -Wunused-function  -Wunused-label  -Wunused-parameter \
    -Wunused-value  -Wunused-variable  -Wvariadic-macros \
    -Wvolatile-register-var  -Wwrite-strings
LDLIBS=-lm -lz
EXEC=vidjil
MAINCORE=$(wildcard *.cpp)
LIBCORE=core/vidjil.a lib/lib.a

BINDIR=../
CGIDIR=../browser/cgi/
TOOLDIR=tools/

VIDJIL=$(BINDIR)$(EXEC)
ALIGN_CGI=$(CGIDIR)align.cgi
SIMILARITY_CGI=$(CGIDIR)similarity.cgi
SIMILARITY_TOOL=$(TOOLDIR)similarity

CREATE_VERSION_GIT_H := $(shell test -x ./create-git-version-h.sh && ./create-git-version-h.sh)

.PHONY: all core lib clean forcedep

all: $(VIDJIL) $(ALIGN_CGI) $(SIMILARITY_CGI) $(SIMILARITY_TOOL)
	$(MAKE) -C $(TOOLDIR)

base: $(VIDJIL)

###

paranoid: clean
	$(MAKE) vidjil OPTIM="$(PARANOID)"

###

kmers: cleankmers
	$(MAKE) CONFIG="-DDEBUG_KMERS"

nokmers: cleankmers
	$(MAKE)

cleankmers:
	rm -f vidjil.o core/windowExtractor.o core/segment.o

###

spaced: cleanspaced
	$(MAKE)

nospaced: cleanspaced
	$(MAKE) CONFIG="-DNO_SPACED_SEEDS"

cleanspaced:
	rm -f vidjil.o core/tools.o

###

$(ALIGN_CGI): cgi/align.o $(LIBCORE)
	mkdir -p $(CGIDIR)
	$(MAKE) -C core OPTIM="$(OPTIM)"
	$(CXX) -o $@ $^ $(LDFLAGS) $(LDLIBS) $(CXXFLAGS)

$(SIMILARITY_CGI): cgi/similarity.o $(LIBCORE)
	mkdir -p $(CGIDIR)
	$(MAKE) -C core OPTIM="$(OPTIM)"
	$(CXX) -o $@ $^ $(LDFLAGS) $(LDLIBS) $(CXXFLAGS)

$(SIMILARITY_TOOL): cgi/similarity.o $(LIBCORE)
	mkdir -p $(TOOLDIR)
	$(MAKE) -C core OPTIM="$(OPTIM)"
	$(CXX) -o $@ $^ $(LDFLAGS) $(LDLIBS) $(CXXFLAGS)

###

debug:
	$(MAKE) clean
	$(MAKE) DEBUG="-ggdb"

$(VIDJIL): $(BINDIR)%: %.o $(LIBCORE)
	$(MAKE) -C core OPTIM="$(OPTIM)"
	$(MAKE) -C lib OPTIM="$(OPTIM)"
	$(CXX) -o $@ $^ $(LDFLAGS) $(LDLIBS) $(CXXFLAGS)

###
# Subdirectories
###

core/%.a: FORCE
	$(MAKE) -C core $(notdir $@)

lib/%.a: FORCE
	$(MAKE) -C lib $(notdir $@)

clean:
	$(MAKE) -C core $@
	$(MAKE) -C lib $@
	rm -f *.o cgi/*.o
	cd $(BINDIR) ; rm -f $(EXEC)
	$(MAKE) -C tests $@

cleancoverage: clean
	rm -f *.gcda *.gcno *.gcov
	$(MAKE) -C core cleancoverage
	$(MAKE) -C lib cleancoverage

cleanall: cleancoverage
	$(MAKE) -C tests cleanall

forcedep:
	$(CXX) $(CXXFLAGS) -M $(MAINCORE) > dep.mk
	$(MAKE) -C core forcedep
	$(MAKE) -C lib forcedep

FORCE:

DEP=$(wildcard dep.mk)

ifeq (${DEP},)
$(shell	$(CXX) $(CXXFLAGS) -M $(MAINCORE) > dep.mk)
endif
include dep.mk

