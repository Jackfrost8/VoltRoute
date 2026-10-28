package com.voltroute.external.ocm.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
public class OcmAddressInfo {

    @JsonProperty("ID")
    private Long id;

    @JsonProperty("Title")
    private String title;

    @JsonProperty("AddressLine1")
    private String addressLine1;

    @JsonProperty("AddressLine2")
    private String addressLine2;

    @JsonProperty("Town")
    private String town;

    @JsonProperty("StateOrProvince")
    private String stateOrProvince;

    @JsonProperty("Postcode")
    private String postcode;

    @JsonProperty("CountryID")
    private Integer countryId;

    @JsonProperty("Country")
    private OcmCountry country;

    @JsonProperty("Latitude")
    private Double latitude;

    @JsonProperty("Longitude")
    private Double longitude;

    @JsonProperty("ContactTelephone1")
    private String contactTelephone1;

    @JsonProperty("ContactEmail")
    private String contactEmail;

    @JsonProperty("AccessComments")
    private String accessComments;

    @JsonProperty("RelatedURL")
    private String relatedUrl;

    @JsonProperty("Distance")
    private Double distance;

    @JsonProperty("DistanceUnit")
    private Integer distanceUnit;
}
