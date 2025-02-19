import { sub } from "date-fns";
import { ObjectId } from "mongodb";
import { places } from "../constants/paths";
import { connectToDatabase } from "../libs/mongo";

export const createManyJobs = async (data) => {
  const { db } = await connectToDatabase();
  const createdAt = new Date().toISOString();

  const filterPromise = data.map((d) =>
    db.collection("jobs").find({ link: d.link }).toArray()
  );

  const results = await Promise.all(filterPromise);
  const filterResults = results.flat();

  const filteredData = data.filter((d) => {
    const currentLink = d.link;
    const hasDuplicates = filterResults.some((r) => r.link === currentLink);

    return !hasDuplicates;
  });

  if (filteredData.length === 0) {
    return;
  }

  const formattedData = filteredData.map((d) => {
    const postedAt = Boolean(d?.schema?.datePosted)
      ? d?.schema?.datePosted
      : createdAt;

    return {
      ...d,
      createdAt,
      postedAt,
    };
  });

  const jobs = await db.collection("jobs").insertMany(formattedData);
  return jobs;
};

export const getWeeklyJobs = async () => {
  const { db } = await connectToDatabase();

  const pipeline = [
    {
      $addFields: {
        date: {
          $dateFromString: {
            dateString: "$postedAt",
          },
        },
      },
    },
    {
      $match: {
        date: {
          $gte: new Date(sub(new Date(), { days: 7 })),
        },
      },
    },
    {
      $match: {
        keywords: {
          $in: places.map((p) => p.replaceAll("-", " ")),
        },
      },
    },
    {
      $project: {
        source: 1,
        company: 1,
        title: 1,
        slug: 1,
        postedAt: 1,
        "schema.title": 1,
        "schema.hiringOrganization.name": 1,
      },
    },
  ];

  const cursor = await db
    .collection("jobs")
    .aggregate(pipeline)
    .sort({ postedAt: -1 })
    .toArray();

  const jobs = JSON.parse(JSON.stringify(cursor));

  return { jobs };
};

export const getLatestJobs = async (limit) => {
  const { db } = await connectToDatabase();

  const pipeline = [
    {
      $match: {
        featuredUntil: null,
      },
    },
    {
      $match: {
        keywords: {
          $in: places.map((p) => p.replaceAll("-", " ")),
        },
      },
    },
  ];

  const cursor = await db
    .collection("jobs")
    .aggregate(pipeline)
    .sort({ postedAt: -1 })
    .limit(limit)
    .toArray();

  const jobs = JSON.parse(JSON.stringify(cursor));

  return { jobs };
};

export const getRemoteJobs = async (limit) => {
  const { db } = await connectToDatabase();

  const pipeline = [
    {
      $match: {
        keywords: {
          $in: ["remote"],
        },
      },
    },
  ];

  const cursor = await db
    .collection("jobs")
    .aggregate(pipeline)
    .sort({ postedAt: -1 })
    .limit(limit)
    .toArray();

  const jobs = JSON.parse(JSON.stringify(cursor));

  return { jobs };
};

export const getJobs = async ({ tech, location }) => {
  const { db } = await connectToDatabase();

  const pipeline = constructPipeline({ tech, location });

  const cursor = await db
    .collection("jobs")
    .aggregate(pipeline)
    .sort({ postedAt: -1 })
    .limit(10)
    .toArray();

  const jobs = JSON.parse(JSON.stringify(cursor));
  return { jobs };
};

export const getJobsJSON = async ({
  tech,
  location,
  page = 1,
  limit = 10,
  sortBy = "posted",
  jobType,
}) => {
  const { db } = await connectToDatabase();

  const serializeTech = tech?.map((t) => serialize(t)).flat();
  const serializeLocation = location?.map((l) => serialize(l)).flat();
  const skip = page - 1 < 0 ? 0 : page - 1;

  let pipeline = [];

  if (serializeTech?.length > 0) {
    pipeline.push({
      $match: {
        keywords: {
          $in: serializeTech,
        },
      },
    });
  }

  if (serializeLocation?.length > 0) {
    pipeline.push({
      $match: {
        keywords: {
          $in: serializeLocation,
        },
      },
    });
  } else {
    pipeline.push({
      $match: {
        keywords: {
          $in: places.map((p) => p.replaceAll("-", " ")),
        },
      },
    });
  }

  if (jobType?.length > 0) {
    const jobTypePipeline = jobType?.map((j) => {
      const fullTime = [
        "full-time",
        "full time",
        "full_time",
        "FULL-TIME",
        "FULL TIME",
        "FULL_TIME",
      ];
      const partTime = [
        "part-time",
        "part time",
        "part_time",
        "PART-TIME",
        "PART TIME",
        "PART_TIME",
      ];
      const contract = ["contract", "CONTRACT"];
      const internship = ["internship", "INTERNSHIP", "intern", "INTERN"];

      switch (j) {
        case "full time":
          return fullTime;
        case "part time":
          return partTime;
        case "contract":
          return contract;
        case "internship":
          return internship;
        default:
          return;
      }
    });

    pipeline.push({
      $match: {
        "schema.employmentType": {
          $in: jobTypePipeline.flat(),
        },
      },
    });
  }

  if (sortBy === "posted") {
    pipeline.push({ $sort: { postedAt: -1 } });
  } else {
    pipeline.push({ $sort: { createdAt: -1 } });
  }

  pipeline = [
    ...pipeline,
    {
      $match: {
        featuredUntil: null,
      },
    },
    { $skip: skip * limit },
    { $limit: limit },
  ];

  const cursor = await db.collection("jobs").aggregate(pipeline).toArray();
  const jobs = JSON.parse(JSON.stringify(cursor));

  return { jobs };
};

export const getFeaturedJobs = async () => {
  const { db } = await connectToDatabase();

  const pipeline = [
    {
      $match: {
        featuredUntil: {
          $gte: new Date(),
        },
      },
    },
    { $sort: { postedAt: -1 } },
  ];

  const cursor = await db.collection("jobs").aggregate(pipeline).toArray();
  const featured = JSON.parse(JSON.stringify(cursor));

  return { featured };
};

const constructPipeline = ({ tech, location }) => {
  if (tech === "all") {
    return [
      {
        $match: {
          keywords: {
            $in: serialize(location),
          },
        },
      },
    ];
  }

  // specific all
  if (location === "all") {
    return [
      {
        $match: {
          keywords: {
            $in: serialize(tech),
          },
        },
      },
    ];
  }

  // specific specific
  return [
    {
      $match: {
        keywords: {
          $in: serialize(tech),
        },
      },
    },
    {
      $match: {
        keywords: {
          $in: serialize(location),
        },
      },
    },
  ];
};

const serialize = (query) => [new RegExp(query.replaceAll("-", " "))];

export const getAllSlugs = async () => {
  const { db } = await connectToDatabase();

  const cursor = await db
    .collection("jobs")
    .find()
    .project({ slug: 1 })
    .toArray();

  const jobs = JSON.parse(JSON.stringify(cursor));

  return { jobs };
};

export const getJobBySlug = async (slug) => {
  const { db } = await connectToDatabase();

  const cursor = await db.collection("jobs").findOne({ slug });

  const job = JSON.parse(JSON.stringify(cursor));

  return { job };
};

export const addRemoteTag = async () => {
  const { db } = await connectToDatabase();

  const fetch = JSON.parse(
    JSON.stringify(
      await db
        .collection("jobs")
        .find()
        .project({ createdAt: 1, "schema.datePosted": 1 })
        .toArray()
    )
  );

  const promises = fetch.map((s) => {
    const postedAt = Boolean(s?.schema?.datePosted)
      ? s?.schema?.datePosted
      : s?.createdAt;
    return db.collection("jobs").update(
      {
        _id: ObjectId(s._id),
      },
      {
        $set: {
          postedAt,
        },
      }
    );
  });

  // await Promise.all(promises);

  return { fetch };
};
