"""
Tool Registry for BLACKOUT.
Role in SENSE-REPLAN-ACT loop: Manages tool lifecycles and routes agent step execution
to the appropriate tool instance. Probed during SENSE; executed during ACT.
"""

from typing import Dict, List, Optional
from app.tools.base import BaseTool
from app.tools.internet_tool import InternetTool
from app.tools.weather_tool import WeatherTool
from app.tools.calendar_tool import CalendarTool
from app.tools.local_cache_tool import LocalCacheTool
from app.tools.filesystem_tool import FilesystemTool
from app.models.capability import ToolHealth

class ToolRegistry:
    def __init__(self):
        self._tools: Dict[str, BaseTool] = {
            "internet": InternetTool(),
            "weather_api": WeatherTool(),
            "calendar": CalendarTool(),
            "local_cache": LocalCacheTool(),
            "filesystem": FilesystemTool(),
        }

    def get_tool(self, name: str) -> Optional[BaseTool]:
        return self._tools.get(name)

    def list_tools(self) -> List[BaseTool]:
        return list(self._tools.values())

    async def probe_all(self) -> Dict[str, ToolHealth]:
        """Probes all registered tools asynchronously in parallel during the SENSE phase."""
        health_map: Dict[str, ToolHealth] = {}
        for name, tool in self._tools.items():
            health_map[name] = await tool.probe_health()
        return health_map

tool_registry = ToolRegistry()
