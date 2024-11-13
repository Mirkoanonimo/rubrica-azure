# tests/run_tests.py
import pytest
import logging
import sys
import os
from datetime import datetime
from pathlib import Path

# Aggiungi la directory root del progetto al PYTHONPATH
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))

def setup_logging():
    """Configura il logging per i test"""
    # Crea directory per i log se non esiste
    log_dir = Path("test_logs")
    log_dir.mkdir(exist_ok=True)
    
    # Crea nome file con timestamp
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    log_file = log_dir / f"test_results_{timestamp}.log"
    
    # Configura logging
    logging.basicConfig(
        level=logging.DEBUG,
        format='%(asctime)s [%(levelname)s] %(message)s - %(filename)s:%(lineno)d',
        handlers=[
            logging.FileHandler(log_file),
            logging.StreamHandler(sys.stdout)
        ]
    )
    
    return log_file

def print_summary(duration, total_tests, passed, failed, errors, skipped):
    """Stampa un sommario dei test"""
    print("\n" + "="*60)
    print("TEST SUMMARY")
    print("="*60)
    print(f"Duration: {duration:.2f} seconds")
    print(f"Total Tests: {total_tests}")
    print(f"Passed: {passed}")
    print(f"Failed: {failed}")
    print(f"Errors: {errors}")
    print(f"Skipped: {skipped}")
    print("="*60)

def main():
    """Funzione principale per eseguire i test"""
    log_file = setup_logging()
    logger = logging.getLogger("test_runner")
    
    try:
        logger.info("Starting API tests")
        start_time = datetime.now()
        
        # Crea directory per i report di coverage
        coverage_dir = Path("coverage_reports")
        coverage_dir.mkdir(exist_ok=True)
        
        # Configura gli argomenti per pytest
        pytest_args = [
            "tests",                      # directory dei test
            "-v",                         # output verboso
            "--log-cli-level=DEBUG",      # livello log CLI
            f"--log-file={log_file}",     # file di log
            "--log-file-level=DEBUG",     # livello log file
            "--tb=short",                 # traceback format
            "-s",                         # mostra output
            "--cov=app",                  # misura coverage
            f"--cov-report=html:{coverage_dir}/html",  # report coverage HTML
            "--cov-report=term-missing",  # report coverage terminal con linee mancanti
            "--durations=10",             # mostra i 10 test più lenti
            "-rf",                        # mostra extra summary info
        ]
        
        # Esegui i test
        logger.info(f"Test results will be saved to {log_file}")
        logger.info(f"Coverage report will be saved to {coverage_dir}/html")
        
        exit_code = pytest.main(pytest_args)
        
        # Calcola durata
        duration = (datetime.now() - start_time).total_seconds()
        
        # Log risultati
        if exit_code == 0:
            logger.info("All tests passed successfully!")
            print_summary(
                duration=duration,
                total_tests=pytest.main(['--collect-only', '-qq']),
                passed=pytest.main(['--passed', '-qq']),
                failed=0,
                errors=0,
                skipped=pytest.main(['--skipped', '-qq'])
            )
        else:
            logger.error(f"Tests failed with exit code: {exit_code}")
            failed_tests = pytest.main(['--failed', '-qq'])
            error_tests = pytest.main(['--errors', '-qq'])
            print_summary(
                duration=duration,
                total_tests=pytest.main(['--collect-only', '-qq']),
                passed=pytest.main(['--passed', '-qq']),
                failed=failed_tests,
                errors=error_tests,
                skipped=pytest.main(['--skipped', '-qq'])
            )
        
        # Apri il report di coverage nel browser
        if sys.platform.startswith('darwin'):  # macOS
            os.system(f'open {coverage_dir}/html/index.html')
        elif sys.platform.startswith('linux'):  # Linux
            os.system(f'xdg-open {coverage_dir}/html/index.html')
        elif sys.platform.startswith('win32'):  # Windows
            os.system(f'start {coverage_dir}/html/index.html')
            
        return exit_code
        
    except Exception as e:
        logger.error(f"Error running tests: {str(e)}", exc_info=True)
        return 1

if __name__ == "__main__":
    sys.exit(main())