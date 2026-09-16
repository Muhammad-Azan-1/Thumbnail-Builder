import logging
import sys

class ColoredFormatter(logging.Formatter):
    """
    Custom logging formatter that applies:
    1. Distinct colors for each Log Level (INFO, WARNING, ERROR, DEBUG, CRITICAL).
    2. Distinct, unique colors for each Logger / Module Name (e.g., openai_service, thumbnails_router, etc.).
    3. Clean timestamp and message formatting.
    """

    RESET = "\033[0m"
    BOLD = "\033[1m"

    # Colors for Log Levels
    LEVEL_COLORS = {
        "DEBUG": "\033[90m",          # Bright Black / Gray
        "INFO": "\033[92m",           # Bright Green
        "WARNING": "\033[93m",        # Bright Yellow
        "ERROR": "\033[91m",          # Bright Red
        "CRITICAL": "\033[1;91m",     # Bold Bright Red
    }

    # Explicit color assignments for primary app modules for distinct visibility
    EXPLICIT_LOGGER_COLORS = {
        "src.app": "\033[96m",                         # Bright Cyan
        "src.routes.thumbnails": "\033[95m",           # Bright Magenta
        "src.services.openai_service": "\033[93m",     # Bright Yellow
        "src.services.imagekit_services": "\033[96m",  # Bright Cyan
        "src.services.generate_image": "\033[94m",    # Bright Blue
        "src.core.error_handler": "\033[91m",          # Bright Red
        "src.core.exceptions": "\033[38;5;208m",       # Orange
        "src.db.db": "\033[38;5;141m",                 # Purple
        "uvicorn": "\033[97m",                         # Bright White
        "uvicorn.access": "\033[32m",                  # Green
        "uvicorn.error": "\033[91m",                   # Bright Red
    }

    # Color palette used to deterministically hash colors for any other logger names
    PALETTE = [
        "\033[96m",       # Bright Cyan
        "\033[95m",       # Bright Magenta
        "\033[94m",       # Bright Blue
        "\033[93m",       # Bright Yellow
        "\033[92m",       # Bright Green
        "\033[36m",       # Cyan
        "\033[35m",       # Magenta
        "\033[34m",       # Blue
        "\033[33m",       # Yellow
        "\033[38;5;208m", # Orange
        "\033[38;5;141m", # Purple
        "\033[38;5;213m", # Pink
    ]

    def _get_logger_color(self, logger_name: str) -> str:
        """Returns an assigned or deterministically hashed ANSI color string for the logger name."""
        if logger_name in self.EXPLICIT_LOGGER_COLORS:
            return self.EXPLICIT_LOGGER_COLORS[logger_name]
        
        # Calculate a deterministic index based on module name hash
        index = abs(hash(logger_name)) % len(self.PALETTE)
        return self.PALETTE[index]

    def format(self, record: logging.LogRecord) -> str:
        # Preserve original record values to avoid mutating state shared across handlers
        orig_levelname = record.levelname
        orig_name = record.name

        # Clean up uvicorn's internal logger naming for non-error logs
        display_name = orig_name
        if orig_name == "uvicorn.error" and orig_levelname in ("INFO", "DEBUG"):
            display_name = "uvicorn.server"

        # Color the level name
        level_color = self.LEVEL_COLORS.get(orig_levelname, self.RESET)
        record.levelname = f"{level_color}{orig_levelname:<8}{self.RESET}"

        # Color the logger name
        logger_color = self._get_logger_color(display_name)
        record.name = f"{logger_color}[{display_name}]{self.RESET}"

        # Format record
        result = super().format(record)

        # Restore original record attributes
        record.levelname = orig_levelname
        record.name = orig_name

        return result


def setup_logging(level: int = logging.INFO) -> None:
    """
    Configures standard logging and Uvicorn loggers with colored output.
    Call this function once when initializing your backend application.
    """
    formatter = ColoredFormatter(
        fmt="%(asctime)s | %(levelname)s | %(name)s | %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S",
    )

    # Configure stdout stream handler
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setFormatter(formatter)

    # Configure root logger
    root_logger = logging.getLogger()
    root_logger.setLevel(level)
    root_logger.handlers = [console_handler]

    # Intercept Uvicorn loggers so request logs share the same color formatting
    for uvicorn_logger_name in ("uvicorn", "uvicorn.access", "uvicorn.error"):
        uv_logger = logging.getLogger(uvicorn_logger_name)
        uv_logger.handlers = [console_handler]
        uv_logger.propagate = False


def get_logger(name: str) -> logging.Logger:
    """
    Returns a logger instance for a given module name.
    Usage: logger = get_logger(__name__)
    """
    return logging.getLogger(name)
