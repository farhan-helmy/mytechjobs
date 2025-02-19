import React from "react";
import NextLink from "next/link";
import { format } from "date-fns";
import {
  Badge,
  Flex,
  HStack,
  LinkBox,
  LinkOverlay,
  Tag,
  Text,
} from "@chakra-ui/react";

import { checkIfThisWeek } from "../helpers/checkIfThisWeek";
import { JOB_TYPE_TEXT } from "../types/jobs";
import PinIcon from "../icons/PinIcon";
import CalendarIcon from "../icons/CalendarIcon";
import BriefcaseIcon from "../icons/BriefcaseIcon";
import CashIcon from "../icons/CashIcon";

function JobListing({ job, featured = false }) {
  const title = job?.schema?.title || job?.title;
  const companyName =
    job?.company?.name || job?.schema?.hiringOrganization?.name;
  const datePosted = job?.postedAt;
  const dateCreated = job?.createdAt;
  const jobAdType = job?.location?.type;
  const jobAdLocation = job?.location?.city + ", " + job?.location?.state;

  const thisWeek = checkIfThisWeek(dateCreated);

  const getJobLocation = () => {
    switch (jobAdType) {
      case 1:
        return "Full Remote";
      case 2:
        return jobAdLocation;
      case 3:
        return jobAdLocation + " (Hybrid)";
      default:
        return (
          job?.schema?.jobLocation?.address?.stressAddress ||
          job?.schema?.jobLocation?.address?.addressLocality ||
          job?.schema?.jobLocation?.address?.addressRegion
        );
    }
  };
  const jobLocation = getJobLocation();

  const employmentType = job?.schema?.employmentType;
  const isEmploymentTypeArray = Array.isArray(employmentType);

  const employmentTypeValue = isEmploymentTypeArray
    ? employmentType.join(", ")
    : employmentType;

  const employmentTypeText =
    (employmentTypeValue ?? "")?.replaceAll("_", " ").toLowerCase() ||
    JOB_TYPE_TEXT[job?.type] ||
    "Unspecified";

  const salary = job?.salary;

  return (
    <LinkBox
      as={Flex}
      flexDirection="column"
      mt="2"
      p="4"
      borderRadius="lg"
      bg={featured ? "teal.50" : "white"}
      borderWidth={featured ? "3px" : "1px"}
      borderColor={featured ? "teal.300" : "gray.300"}
    >
      <HStack>
        <NextLink href={`/jobs/${job.slug}`} legacyBehavior passHref>
          <Text as={LinkOverlay} noOfLines="1" fontWeight="bold">
            {title}
          </Text>
        </NextLink>

        {thisWeek && <Badge colorScheme="green">New</Badge>}
      </HStack>
      <Flex flexDirection="column" fontSize="sm" color="gray.600">
        {companyName && <Text>{companyName}</Text>}
        <HStack mt="2">
          <CalendarIcon />
          <Text>
            {datePosted
              ? "Posted on " + format(new Date(datePosted), "do MMM yyyy")
              : "Unspecified"}
          </Text>
        </HStack>
        <HStack>
          <PinIcon />
          <Text noOfLines="1">{jobLocation ?? "Unspecified"}</Text>
        </HStack>
        <HStack>
          <BriefcaseIcon />
          <Text fontSize="sm" textTransform="capitalize">
            {employmentTypeText}
          </Text>
        </HStack>
        {salary && (
          <HStack>
            <CashIcon />
            <Text fontSize="sm" textTransform="capitalize">
              {new Intl.NumberFormat("en-UK", {
                style: "currency",
                currency: "MYR",
              }).format(salary)}
            </Text>
          </HStack>
        )}
      </Flex>
      <HStack mt="4">
        {job?.keywords.map((keyword) => (
          <Tag key={keyword} size="sm" colorScheme="blackAlpha">
            {keyword}
          </Tag>
        ))}
      </HStack>

      <HStack mt="2">
        {dateCreated && (
          <Text fontSize="xs" color="gray.600" mt="2">
            {"Added on " + format(new Date(dateCreated), "do MMM yyyy")}
          </Text>
        )}
      </HStack>
    </LinkBox>
  );
}

export default JobListing;
