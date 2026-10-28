package com.voltroute.external.ors.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
public class OrsSummary {
    /**
     * Total route distance in meters.
     */
    private Double distance;

    /**
     * Total route driving duration in seconds.
     */
    private Double duration;
}
