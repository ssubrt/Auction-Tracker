import { ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatsCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon?: ReactNode;
  trend?: number;
  trendText?: string;
  className?: string;
  valuePrefix?: string;
  valueSuffix?: string;
}

export function StatsCard({
  title,
  value,
  description,
  icon,
  trend,
  trendText,
  className,
  valuePrefix,
  valueSuffix,
}: StatsCardProps) {
  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon && <div className="h-4 w-4 text-muted-foreground">{icon}</div>}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">
          {valuePrefix}
          {value}
          {valueSuffix}
        </div>
        {(description || trend) && (
          <p className="text-xs text-muted-foreground">
            {description}
            {trend && (
              <span
                className={cn(
                  "ml-1",
                  trend > 0 ? "text-green-500" : "text-red-500"
                )}
              >
                {trend > 0 ? "+" : ""}
                {trend}%
              </span>
            )}
            {trendText && <span className="ml-1">{trendText}</span>}
          </p>
        )}
      </CardContent>
    </Card>
  );
}