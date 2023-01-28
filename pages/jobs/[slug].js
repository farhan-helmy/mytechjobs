import Head from "next/head";
import React from "react";
import NextLink from "next/link";
import {
  Badge,
  Box,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  Button,
  Flex,
  Heading,
  HStack,
  Tag,
  Text,
} from "@chakra-ui/react";
import { format } from "date-fns";
import queryString from "query-string";

import { checkIfThisWeek } from "../../helpers/checkIfThisWeek";
import { siteDescription } from "../../constants/SEO";
import { getAllSlugs, getJobBySlug } from "../../controllers/jobs";
import PinIcon from "../../icons/PinIcon";
import CalendarIcon from "../../icons/CalendarIcon";
import GlobalHeader from "../../components/GlobalHeader";

export const getStaticProps = async (context) => {
  const { slug } = context.params;
  const { job } = await getJobBySlug(slug);

  return {
    props: { job, slug },
    // revalidate every 2 hour
    revalidate: 60 * 60 * 2,
  };
};

export async function getStaticPaths() {
  const { jobs } = await getAllSlugs();
  const paths = jobs.map((j) => ({ params: { slug: j.slug } }));

  return {
    paths,
    fallback: true,
  };
}

function ApplyButton({ link }) {
  return (
    <Button
      as="a"
      href={link}
      target="_blank"
      colorScheme="messenger"
      w={{ base: "full", lg: "200px" }}
    >
      Apply Now 🚀
    </Button>
  );
}

function JobDescription({ job, slug }) {
  const jobTitle =
    (job?.schema?.title ?? job?.title) ||
    "Opps... Can't find the job you're looking for";

  const companyName = job?.schema?.hiringOrganization?.name;
  const datePosted = job?.postedAt;
  const jobDescription =
    job?.schema?.responsibilities || job?.schema?.description;
  const jobLocation =
    job?.schema?.jobLocation?.address?.stressAddress ||
    job?.schema?.jobLocation?.address?.addressLocality ||
    job?.schema?.jobLocation?.address?.addressRegion;

  const pageTitleWithoutBrand = companyName
    ? `${jobTitle} – ${companyName}`
    : jobTitle;

  const pageTitle = pageTitleWithoutBrand + " | Kerja IT 🇲🇾";
  const thisWeek = checkIfThisWeek(job?.schema?.datePosted ?? job?.createdAt);

  const og = queryString.stringifyUrl(
    {
      url: "https://kerja-it.com/api/og",
      query: {
        title: jobTitle ? jobTitle : null,
        company: companyName ? companyName : null,
      },
    },
    { skipEmptyString: true, skipNull: true }
  );

  return (
    <Box bg="gray.50" pb="16">
      <Head>
        <title>{pageTitle}</title>
        <meta name="description" content={siteDescription} />
        <link rel="icon" href="/favicon.ico" />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={siteDescription} />
        <meta property="og:image" content={og} />
        <meta property="og:url" content={`https://kerja-it.com/jobs/${slug}`} />
        <meta property="og:site_name" content="Kerja IT" />
        <meta name="twitter:card" content="summary_large_image" />
      </Head>
      <GlobalHeader />
      <Breadcrumb mt="8" maxW="2xl" mb="4" mx={{ base: "4", md: "auto" }}>
        <BreadcrumbItem>
          <BreadcrumbLink href="/">Home</BreadcrumbLink>
        </BreadcrumbItem>

        <BreadcrumbItem>
          <BreadcrumbLink href="/jobs">Jobs</BreadcrumbLink>
        </BreadcrumbItem>

        {job && (
          <BreadcrumbItem isCurrentPage>
            <BreadcrumbLink href={`/jobs/${slug}`} noOfLines="1">
              {pageTitleWithoutBrand}
            </BreadcrumbLink>
          </BreadcrumbItem>
        )}
      </Breadcrumb>
      {!job && (
        <Flex
          flexDirection="column"
          maxW="2xl"
          mx="auto"
          p={{ base: "4", md: "0" }}
          textAlign="center"
          alignItems="center"
        >
          <Heading>😵‍💫 Opps...</Heading>
          <Heading size="md" mt="2" color="gray.500">
            Can&apos;t fint the job you&apos;re looking for.
          </Heading>
          <Flex mt="8">
            <Button colorScheme="messenger" as={NextLink} href="/jobs">
              Look for other jobs instead 🦄
            </Button>
          </Flex>
        </Flex>
      )}
      {job && (
        <Flex
          flexDirection="column"
          maxW="2xl"
          mx="auto"
          p={{ base: "4", md: "8" }}
          bg="white"
          borderWidth={{ base: "none", md: "1px" }}
          borderColor="gray.300"
          borderRadius={{ base: "none", md: "lg" }}
        >
          <HStack>
            {job?.keywords.map((keyword) => (
              <Tag key={keyword} size="sm" colorScheme="blackAlpha">
                {keyword}
              </Tag>
            ))}
          </HStack>
          <Heading size="lg" mt="2">
            {jobTitle}
          </Heading>
          <Flex flexDirection="column">
            {companyName && <Text fontSize="md">{companyName}</Text>}
            <HStack mt="2">
              <PinIcon />
              <Text fontSize="sm">{jobLocation ?? "Unspecified"}</Text>
            </HStack>
            <HStack>
              <CalendarIcon />
              <Text fontSize="sm">
                {datePosted
                  ? "Posted on " + format(new Date(datePosted), "do MMM yyyy")
                  : "Unspecified"}
              </Text>
              {thisWeek && <Badge colorScheme="green">New</Badge>}
            </HStack>
          </Flex>
          <Flex mt="8">
            <ApplyButton link={job?.link} />
          </Flex>
          <Flex flexDirection="column" mt="8">
            <Heading size="md" mb="2">
              ✍️ Job Description
            </Heading>
            <Box
              mt="2"
              p={{ base: "4", md: "8" }}
              fontFamily="sans-serif"
              dangerouslySetInnerHTML={{
                __html: jobDescription,
              }}
            />
          </Flex>
          <Flex mt="8">
            <ApplyButton link={job?.link} />
          </Flex>
        </Flex>
      )}
    </Box>
  );
}

export default JobDescription;
